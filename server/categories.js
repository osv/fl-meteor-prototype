Meteor.publish('cats', function() {
  var options = {};

  // если админ то показываем и удаленные категории
  if (! isAdminById(this.userId))
    options = {rm: {$ne: true }};

  return Categories.find(options);
});

/* 
Обычно эта подписка  нужна юзеру что хочет  редактировать свой профиль
или админу для  редактирования цен. Колекция не большая,  потому как и
категории отправляем всю.
*/
Meteor.publish('priceTmpAll', function() {
  return PriceTmp.find({});
});
