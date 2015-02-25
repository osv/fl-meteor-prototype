Template.usersAdmin.events({
  'keypress th input': function(e, t){
    if (e.which === 13) {
      var phone = t.find("#searchPhone").value,
          contact = t.find("#searchContact").value,
          filters = {};
      if (phone)
        filters.phone = {$regex: mkRegexp(phone)};
      if (contact)
        filters["profile.completeName"] = {$regex: mkRegexp(contact), $options: 'i'};
      Paginations.usersPages.set("filters", filters);
    }
  }
});

Template.usersAdmin.rendered = function() {
  Paginations.usersPages.set("filters", {createdAt: {$lt: new Date()}});
  Paginations.usersPages.set("sort", {createdAt: -1});
};

Template.userInfoForAdmin.helpers({
  formatedPhone: function() {
    return formatPhone( this.phone );
  },
  role: function(){
    return isMaster(this) ? "Исполнитель" : "Заказчик";
  },
  isAdmin: function() {
    return this.isAdmin ? "Админ" : "Нет";
  },
  created: function() {
    if (typeof this.createdAt !== 'undefined') {
      return moment(this.createdAt).format("YYYY/MM/DD hh:mm");
    } else
      return '';
  },
  fromNow: function() {
    if (typeof this.createdAt !== 'undefined') {
      return moment(this.createdAt).fromNow();
    } else {
      return "Неизвестно";
    }
  },
});

Template.userInfoForAdmin.rendered = function() {
  //initialize tooltip
  $('[data-toggle=tooltip]').tooltip();
};

Template.usersAdminSorter.events({
  'click': function(){
    // значение this.sort указано в шаблоне например {{> usersAdminSorter sort="phone" label="Телефон"}}
    var sort = {};
    sort[this.sort] = Paginations.usersPages.sort.hasOwnProperty(this.sort) ? - Paginations.usersPages.sort[this.sort] : 1;
    Paginations.usersPages.set("sort", sort);
  }
});
