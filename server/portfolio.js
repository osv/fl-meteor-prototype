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
});

Meteor.publish('editMyPortfolio', function (pId) {
  return Portfolio.find({_id: pId, userId: this.userId});
});
