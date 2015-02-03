Template.usersadmin.events({
  'keypress th input': function(e, t){
    if (e.which === 13) {
      var phone = t.find("#searchPhone").value,
          contact = t.find("#searchContact").value,
          filters = {};
      if (phone)
        filters["phone"] = {$regex: mkRegexp(phone), $options: 'i'};
      if (contact)
        filters["profile.completeName"] = {$regex: mkRegexp(contact), $options: 'i'};
      Meteor.usersPages.set("filters", filters);
    }
  }
});

Template.usersadmin.rendered = function() {
  Meteor.usersPages.set("filters", {});
};

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
