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
    return this.isAdmin;
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
  this.$('[data-toggle=tooltip]').tooltip();
};

Template.userInfoForAdmin.events({
  'click [data-action="make-admin"]': function() {
    if (confirm("Дать права админа " + this.profile.completeName + '?'))
      Meteor.call('user-admin-grand', this._id, function(err) {
        if (err)
          Messages.info(err.reason);
      });
  },
  'click [data-action="remove-admin"]': function() {
    if (confirm("Убрать права админа для " + this.profile.completeName + '?'))
      Meteor.call('user-admin-remove', this._id, function(err) {
        if (err)
          Messages.info(err.reason);
      });
  },
  'click [data-action="logout"]': function() {
    Meteor.call('user-force-logout', this._id, function(err) {
      if (err)
        Messages.info(err.reason);
    });
  }
});

Template.usersAdminSorter.events({
  'click': function(){
    // значение this.sort указано в шаблоне например {{> usersAdminSorter sort="phone" label="Телефон"}}
    var sort = {};
    sort[this.sort] = Paginations.usersPages.sort.hasOwnProperty(this.sort) ? - Paginations.usersPages.sort[this.sort] : 1;
    Paginations.usersPages.set("sort", sort);
  }
});

/*
 новый юзер
*/
Template.formNewUserByAdmin.rendered = function(){
  console.log(this.$('form'));
  this.$('form').formValidation({
    framework: 'bootstrap',
    message: 'This value is not valid',
    fields: {
      name: {
        validators: {
          notEmpty: {
            message: "Имя не должно быть пустым"
          },
          stringLength: {
            min: 2,
            max: 50,
            message: "Не поленись набрать хотя б 2 символа",
          },
        }
      },
      phone: {
        validators: {
          callback: {
            callback: function(value) {
              return isPhoneValid( cleanPhoneNumber( value ) );
            },
            message: 'Проверьте правильность ввода номера'
          }
        }
      },
      status: {
        validators: {
          notEmpty: {
            message: "Вы должны выбрать вашу роль"
          }
        }}
    }}).on('success.form.fv', function(e) {
    e.preventDefault();
  });
};

Template.formNewUserByAdmin.events({
  'submit form': function(e, t) {
    e.preventDefault();

    t.$('form').data('formValidation').validate();
    if (!t.$('form').data('formValidation').isValid())
      return false;

    Meteor.call('admin-create-user', 
                cleanPhoneNumber (t.find('[name="phone"]').value),
                t.find('[name="name"]').value,
                t.$('#master').prop('checked'),
                function (err) {
                  if (err)
                    Messages.info(err.reason);
                  else {
                    // завставляем обновить табличку
                    var keyVal = 13;
                    $('#searchPhone').val(this.userId).trigger({
                      type: 'keypress', keyCode: keyVal, which: keyVal, charCode: keyVal });
                  }
                });
    return false;
  }
});
