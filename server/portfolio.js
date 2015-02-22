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
  'portfolio-delete': function(portfolioId) {
    check(portfolioId, String);

    if (!this.userId)
      throw new Meteor.Error(401, 'User not logged in');

    var portfolio = Portfolio.findOne({_id: portfolioId, userId: this.userId});
    if (!portfolio)
      throw new Meteor.Error(400, 'There no such portfolio');

    Meteor.call('portfolio-rm-uploads', portfolioId);

    Portfolio.remove({_id: portfolioId, userId: this.userId});

    logEvent({type: Events.EV_PROFILE, userId: this.userId, name: "Remove portfolio", desc: 'id: '+ portfolioId});
  }
});

Meteor.publish('editMyPortfolio', function (pId) {
  return Portfolio.find({_id: pId, userId: this.userId});
});
