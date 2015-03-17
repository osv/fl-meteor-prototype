// Методы которые отвечают за аплоад картинок в packages/mol-uploads/upload-server.js

Meteor.methods({
  // Создает новое портфолио с статусом {done: false} которое не будет опубликовано
  // нигде до нажатии кнопки "опубликовать", как на одеске короч
  'new-portfolio': function() {
    if (!this.userId)
      throw new Meteor.Error(401, 'User not logged in');

    // ищем не опубликованный портфолио
    var oldProject = Portfolio.findOne({done: false, userId: this.userId});
    if (oldProject)
      return oldProject._id;

    // новый создадим
    
    var id = Portfolio.insert({done: false, userId: this.userId});
    return id;
  },
  'portfolio-title': function(portfolioId, title) {
    check(portfolioId, String);
    check(title, String);

    if (!this.userId)
      throw new Meteor.Error(401, 'User not logged in');

    Portfolio.update({_id: portfolioId,
                      userId: this.userId},
                     {$set: {title: title}});

    Meteor.users.update({_id: this.userId, "gal.id": portfolioId},
                        {$set: {"gal.$.title": title}});

  },
  'portfolio-describe': function(portfolioId, describe) {
    check(portfolioId, String);
    check(describe, String);

    if (!this.userId)
      throw new Meteor.Error(401, 'User not logged in');

    Portfolio.update({_id: portfolioId,
                      userId: this.userId},
                     {$set: {desc: describe}});
  },
  'portfolio-time': function(portfolioId, time) {
    check(portfolioId, String);
    check(time, String);

    if (!this.userId)
      throw new Meteor.Error(401, 'User not logged in');

    Portfolio.update({_id: portfolioId,
                      userId: this.userId},
                     {$set: {time: time}});
  },
  'portfolio-cost': function(portfolioId, cost) {
    check(portfolioId, String);
    check(cost, String);

    if (!this.userId)
      throw new Meteor.Error(401, 'User not logged in');

    if (Portfolio.update({_id: portfolioId,
                      userId: this.userId},
                     {$set: {cost: cost}}));
  },
  'portfolio-cat': function(portfolioId, cat) {
    check(portfolioId, String);
    check(cat, String);

    if (!this.userId)
      throw new Meteor.Error(401, 'User not logged in');

    if (Portfolio.update({_id: portfolioId,
                      userId: this.userId},
                     {$set: {cat: cat}}));
  },
  'portfolio-publish': function(portfolioId) {
    check(portfolioId, String);

    if (!this.userId)
      throw new Meteor.Error(401, 'User not logged in');

    var portfolio = Portfolio.findOne({_id: portfolioId, userId: this.userId},
                                     {fields: {preview: 1, title: 1, img: 1}});

    if (!portfolio)
      throw new Meteor.Error(400, 'There no such portfolio');

    if (!portfolio.preview || !portfolio.img)
      throw new Meteor.Error(503, 'Вы не загрузили фотографии');
    
    Portfolio.update({_id: portfolioId, userId: this.userId}, {$set: {done: true}});
    // добавим к юзеру информацию о портфолио
    if (Meteor.users.update(this.userId,
                        {$addToSet:
                         {gal: {id: portfolioId,
                                preview: portfolio.preview,
                                title: portfolio.title }}})) {
      recalculateUserScore(this.userId);
    }
  },
  'portfolio-delete': function(portfolioId) {
    check(portfolioId, String);

    if (!this.userId)
      throw new Meteor.Error(401, 'User not logged in');

    var portfolio = Portfolio.findOne({_id: portfolioId, userId: this.userId});
    if (!portfolio)
      throw new Meteor.Error(400, 'There no such portfolio');

    Meteor.call('portfolio-rm-uploads', portfolioId);

    Portfolio.remove({_id: portfolioId, userId: this.userId});
    Meteor.users.update(this.userId, {$pull: {gal: {id: portfolioId}}});
    recalculateUserScore(this.userId);
    logEvent({type: Events.EV_PROFILE, userId: this.userId, name: "Remove portfolio", desc: 'id: '+ portfolioId});
  }
});

Meteor.publish('editMyPortfolio', function (pId) {
  return Portfolio.find({_id: pId, userId: this.userId});
});
