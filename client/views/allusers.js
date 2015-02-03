Template.userInfoForAdmin.helpers({
  formatedPhone: function() {
    return formatPhone( this.phone );
  },
  role: function(){
    return this.isMaster ? "Исполнитель" : "Заказчик";
  },
  isAdmin: function() {
    return this.isAdmin ? "Админ" : "Нет";
  },
  created: function() {
    if (typeof this.createdAt !== 'undefined') {
      return this.createdAt.toLocaleString();
    } else {
      return "Неизвестно";
    }
  }
});

Template.usersAdminSorter.events({
  'click': function(){
    // значение this.sort указано в шаблоне например {{> usersAdminSorter sort="phone" label="Телефон"}}
    var sort = {};
    sort[this.sort] = Meteor.usersPages.sort.hasOwnProperty(this.sort) ? - Meteor.usersPages.sort[this.sort] : 1;
    Meteor.usersPages.set("sort", sort);
  }
});
