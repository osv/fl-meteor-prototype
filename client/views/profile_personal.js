/*

 Session.get("currentProfileModal")  - переменная которая содержит текущое модальное окно

 Тоесть, здесь чтобы показать форму:

 ... .js
 Session.set("currentProfileModal", "foo"); 
 $('#profileModal').modal('show');           // #profileModal общий айди для модалок здесь

 ... .html
 <template name="foo">
 </template>

*/

var bsValidator = {
  feedbackIcons: {
      valid: 'fa fa-check',
      invalid: 'fa fa-exclamation',
      validating: 'fa fa-refresh'
    },
};

Template.profilePersonal.helpers({
  currentModal: function() {
    Session.get()
    return Session.get("currentProfileModal");
  }
});

Template.profileInput.rendered = function(){
  this.$('[data-toggle="popover"]').popover();
};


/* ****************************************************
 
 Смены логин телефона

***************************************************** */

Template.profileLoginPhone.helpers({
  currentPhone: function() {
    return formatPhone('' + Meteor.user().phone);
  },
});

Template.profileLoginPhone.events({
  'click #changeLoginPhone': function(){
    Session.set("currentProfileModal", 'modalChangeLoginPhone');
    $('#profileModal').modal('show');
  },
});

Template.modalChangeLoginPhone.helpers({
  currentPhone: function() {
    return formatPhone('' + Meteor.user().phone);
  }
});

Template.modalChangeLoginPhone.rendered = function() {
  $('#sendSMS').formValidation({
    feedbackIcons: bsValidator.feedbackIcons,
    fields: {
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
    }
  }).on('success.form.fv', function(e) {
    // Prevent form submission
    // http://formvalidation.io/examples/form-submit-twice/
    e.preventDefault();
  });

  $('#confirmSMS').formValidation({
    feedbackIcons: bsValidator.feedbackIcons,
    fields: {
      token: {
        validators: {
          notEmpty: {
            message: "Введите код"
          },
          stringLength: {
            min: 6,
            max: 6,
            message: "Код содержит 6 символов",
          },
        }
      },
    }
  }).on('success.form.fv', function(e) {
    e.preventDefault();
  });

};

Template.modalChangeLoginPhone.events({
  'submit #sendSMS': function(e, t) {
    e.preventDefault();
    var phone = t.find('[name="phone"]').value,
        cleanPhone = cleanPhoneNumber(phone);

    t.$('#sendSMS').data('formValidation').validate();
    if (!t.$('#sendSMS').data('formValidation').isValid())
      return false;

    // первый  этап,  блокируем  формочку,  и при  если  нет  проблем,
    // показываем форму для ввода СМС кода
    t.$("#sendSMS fieldset").prop('disabled', true);

    Meteor.call('change login phone', cleanPhone, function(err){
      if (err) {
        t.$("#sendSMS fieldset").prop('disabled', false);
        Messages.info(err.reason);
      } else {
        t.$("#confirmSMS").show();
      }
    });
    return false;
  },
  'submit #confirmSMS': function(e, t) {
    e.preventDefault();
    var phone = t.find('[name="phone"]').value,
        cleanPhone = cleanPhoneNumber(phone),
        token = t.find('[name="token"]').value;

    t.$('#confirmSMS').data('formValidation').validate();
    if (!t.$('#confirmSMS').data('formValidation').isValid())
      return false;

    Meteor.call('change login phone', cleanPhone, token, function(err){
      if (err)
        Messages.info(err.reason);
      else {
        $('#profileModal').modal('hide');
        Messages.info("Изменен номер телефона на <strong>" + phone + "</strong>");
      }
    });
    return false;
  },
});

/* ****************************************************

 Смена пароля

 **************************************************** */

Template.profileChangePassword.events({
  'click #changePassword': function(){
    Session.set("currentProfileModal", "modalChangePassword");
    $('#profileModal').modal('show');
  },
});

Template.modalChangePassword.rendered = function(){
  $('#password').formValidation({
    framework: 'bootstrap',
    message: 'This value is not valid',
    feedbackIcons: bsValidator.feedbackIcons,
    fields: {
      oldPwd: {
        message: 'старый пароль',
        validators: {
          notEmpty: {
            message: 'Пароль не должен быть пустым'
          }
        }
      },
      newPwd1: {
        message: 'Новый пароль',
        validators: {
          notEmpty: {
            message: 'Введите новый пароль'
          },
          stringLength: {
            min: 6,
            max: 128,
            message: 'Пароль должен содержать минимум 6 символов'
          },
          regexp: {
            regexp: /^[a-zA-Z0-9+_,./-]{6,}$/,
            message: 'Пароль должен содержать символы латыни a-Z и цифры.'
          }
        }
      },
      newPwd2: {
        validators: {
          notEmpty: {
            message: 'Поле не должно быть пустым'
          },
          identical: {
            field: 'newPwd1',
            message: 'Повторите пароль что ввели выше'
          }
        }
      }
    }
  }).on('success.form.fv', function(e) {
    e.preventDefault();
  });
};

Template.modalChangePassword.events({
  'submit #password': function(e, t) {
    e.preventDefault();
    var oldPwd = t.find('[name="oldPwd"]').value,
        newPwd1 = t.find('[name="newPwd1"]').value,
        newPwd2 = t.find('[name="newPwd2"]').value;

    t.$('#password').data('formValidation').validate();
    if (!t.$('#password').data('formValidation').isValid())
      return false;

    Meteor.call('change password', oldPwd, newPwd1, function(err){
      if (err)
        Messages.info(err.reason);
      else {
        $('#profileModal').modal('hide');
        Messages.info("Пароль изменен");
      }
    });
    return false;
  },
});

/* ****************************************************

 Контактное лицо

 **************************************************** */

var editContactName = new ReactiveVar(false);

Template.profileContactName.helpers({
  edit: function() {
    return editContactName.get();
  },
  contactName: function(){
    return Meteor.user().profile.completeName;
  }
});

Template.profileContactName.events({
  'click #editContact': function() {
    editContactName.set(true);
  },
});

Template.formContactName.rendered = function() {
  this.$('form').formValidation({
    fields: {
      contact: {
        validators: {
          notEmpty: {
            message: 'Не оставляйте контактное лицо пустым'
          },
          stringLength: {
            max: 58,
            min: 2,
            message: 'Допустимо 58 символов'
          }
        }
      }
    }
  }).on('success.form.fv', function(e) {
    e.preventDefault();
  });
};

Template.formContactName.events({
  'click #save, submit form': function(e, t){
    e.preventDefault();

    t.$('form').data('formValidation').validate();
    if (!t.$('form').data('formValidation').isValid())
      return false;

    var fullName = t.find('[name="contact"]').value;

    editContactName.set(false);

    Meteor.call('change user name', fullName, function(err){
      if (err)
        Messages.info(err.reason);
      else {
        Messages.info('Контактное имя изменено');
        buildQRCode();
      }
    });
    return false;
  },
  'click #cancel': function(){
    editContactName.set(false);
  },
});


/* ****************************************************

 Краткое описание деятельности мастера

 **************************************************** */

var editOverview = new ReactiveVar(false);

Template.profileOverview.helpers({
  edit: function() {
    return editOverview.get();
  },
  overview: function(){
    return Meteor.user().profile.dShort;
  }
});

Template.profileOverview.events({
  'click #editOverview, dblclick #overviewText': function() {
    editOverview.set(true);
  },
});
// form
Template.formOverview.rendered = function(){
  this.$('form').formValidation({
    fields: {
      overview: {
        validators: {
          stringLength: {
            min: 0,
            max: 214,
            message: 'В кратком описании допустимо 214 символов'
          }
        }
      }
    }
  }).on('success.form.fv', function(e) {
    e.preventDefault();
  });
};

Template.formOverview.helpers({
  overview: function(){
    return Meteor.user().profile.dShort;
  }
});

Template.formOverview.events({
  'click #save': function(e, t){
    e.preventDefault();

    t.$('form').data('formValidation').validate();
    if (!t.$('form').data('formValidation').isValid())
      return false;

    var workDescribe = t.find('[name="overview"]').value;

    editOverview.set(false);

    Meteor.call('change user describe short', workDescribe, function(err){
      if (err)
        Messages.info(err.reason);
      else {
        Messages.info('Изменено краткое описание деятельности');
      }
    });
    return false;
  },
  'click #cancel': function(){
    editOverview.set(false);
  },
});


/* ****************************************************

 Описание деятельности мастера ПОДРОБНОЕ

 **************************************************** */

var editWorkDescribe = new ReactiveVar(false);

Template.profileDescribe.helpers({
  edit: function() {
    return editWorkDescribe.get();
  },
  describe: function(){
    return Meteor.user().profile.dLong;
  }
});

Template.profileDescribe.events({
  'click #editDescr, dblclick #descText': function() {
    editWorkDescribe.set(true);
  },
});

//form
Template.formDescribe.helpers({
  describe: function(){
    return Meteor.user().profile.dLong;
  }
});

Template.formDescribe.events({
  'click #save': function(e, t){
    e.preventDefault();

    var workDescribe = t.find('[name="describe"]').value;

    editWorkDescribe.set(false);

    Meteor.call('change user describe long', workDescribe, function(err){
      if (err)
        Messages.info(err.reason);
      else {
        Messages.info('Изменено описание деятельности');
      }
    });
    return false;
  },
  'click #cancel': function(){
    editWorkDescribe.set(false);
  },
});

/* ****************************************************

 Web site

 **************************************************** */

var editWebsite = new ReactiveVar(false);

Template.profileWebsite.helpers({
  edit: function() {
    return editWebsite.get();
  },
  website: function(){
    return Meteor.user().profile.website;
  }
});

Template.profileWebsite.events({
  'click #editWebsite': function() {
    editWebsite.set(true);
  },
});

Template.formWebsite.helpers({
  currentWebsite: function(){
    return Meteor.user().profile.website;
  }
});

Template.formWebsite.rendered = function() {
  this.$('form').formValidation({
    fields: {
      website: {
        validators: {
          uri: {
            message: 'Веб сайт не валидный',
            transformer: function($field, validator) {
              // Get the field value
              var value = $field.val();
              // Check if it doesn't start with http:// or https://
              if (value && value.substr(0, 7) !== 'http://' && value.substr(0, 8) !== 'https://') {
                // then prefix with http://
                value = 'http://' + value;
              }
              // Return new value
              return value;
            }
          },
          stringLength: {
            max: 64,
            message: "Длина URL не должна быть более 72 символов",
          },
        }
      }
    }
  }).on('success.form.fv', function(e) {
    e.preventDefault();
  });
};

Template.formWebsite.events({
  'click #save, submit form': function(e, t){
    e.preventDefault();

    t.$('form').data('formValidation').validate();
    if (!t.$('form').data('formValidation').isValid())
      return false;

    var website = t.find('[name="website"]').value;
    // Check if it doesn't start with http:// or https://
    if (website && website.substr(0, 7) !== 'http://' && website.substr(0, 8) !== 'https://') {
      // then prefix with http://
      website = 'http://' + website;
    }

    editWebsite.set(false);

    Meteor.call('change user website', website, function(err){
      if (err)
        Messages.info(err.reason);
      else {
        Messages.info('Website изменен');
        buildQRCode();
      }
    });
    return false;
  },
  'click #cancel': function(){
    editWebsite.set(false);
  },
});

/* ****************************************************

 Дополнительные контакты

 **************************************************** */

var newContact = new ReactiveVar(false);

// типи контактов,
// При изменении следует изменить и в collection/users.js server/users.js
var contactsTypes = {
  phone: {
    i: 'fa-phone',
    validators:{
      callback: {
        callback: function(value) {
          return isPhoneValid( cleanPhoneNumber( value ) );
        },
        message: 'Проверьте правильность ввода номера'
      }
    }
  },
  email: {
    i: 'fa-envelope',
    placeholder: "john@example.com",
    validators: {
      regexp: {
        regexp: '^[^@\\s]+@([^@\\s]+\\.)+[^@\\s]+$',
        message: 'Неправильный e-mail адрес'
      }
    }
  },
  skype: {
    i: 'fa-skype',
    placeholder: 'Скайп ID',
    validators: {
      regexp: {
        // http://stackoverflow.com/questions/12746862/regular-expressions-for-skype-name-in-php
        regexp: '^[a-zA-Z][a-zA-Z0-9\\.,\\-_]{5,31}$',
        message: 'Проверьте Skype идентификатор'
      }
}
  },
  fax: {
    i: 'fa-fax',
    validators:{
      callback: {
        callback: function(value) {
          return isPhoneValid( cleanPhoneNumber( value ) );
        },
        message: 'Проверьте правильность ввода номера'
      }
    }
  }
};

Template.profileContacts.events({
  // будет показана формочка добавления нового контакта тип которого указан в [data-action]
  'click li a': function(e, t){
    var action = e.target.dataset.action; // data-action attribute
    if (_.contains(_.keys(contactsTypes), action)) {
      newContact.set(action);
    }
  }
});

Template.profileContacts.helpers({
  haveContacts: function(){
    return Meteor.user().profile.contacts;
  },
  newContact: function() { return newContact.get(); }
});

Template.profileContactsTable.helpers({
  contacts:  function(type) {
    return _.where(Meteor.user().profile.contacts, {type: type});
  },
});

//contact item (obj {type, contact})
Template.profileContactRow.helpers({
  formatContact: function() {
    if (this.type === 'phone' || this.type === 'fax')
      return formatPhone(this.contact);
    else
      return this.contact;
  }
});

Template.profileContactRow.events({
  'click [data-action="rm"]': function() {
    var self = this;
    if (confirm('Удалить контакт "' + self.contact + '"?'))
      Meteor.call('user rm contact', self.type, self.contact, function(err){
        if (err)
          Messages.info(err.reason);
        else {
          Messages.info('Контакт удален ' + self.contact);
          buildQRCode();
        }
      });
  }
});

//form
Template.formNewContact.rendered = function(){
  this.$('form').formValidation({
    fields: {
      contact: {
        validators: contactsTypes[ newContact.get() ].validators
      },
    }
  }).on('success.form.fv', function(e) {
    e.preventDefault();
  });

  // bootstrap form phone helper
  var $phone = this.$('.bfh-phone');
  if ($phone)
    $phone.bfhphone($phone.data());
};

Template.formNewContact.helpers({
  placeholder: function() { return contactsTypes[ newContact.get() ].placeholder; },
  icon:        function() { return contactsTypes[ newContact.get() ].i; },
  isPhone:     function() { return newContact.get() === 'phone' || newContact.get() === 'fax'; },
  defaultValue:function() {
    // дефолтный телефон для контакта - телефон входа
    if (newContact.get() === 'phone') {
      return Meteor.user().phone;
    }
    return '';
  }
});

Template.formNewContact.events({
  'click #cancel': function(){
    newContact.set();
  },
  'submit form': function(e, t){
    e.preventDefault();

    t.$('form').data('formValidation').validate();
    if (!t.$('form').data('formValidation').isValid())
      return false;

    var contact = t.find('[name="contact"]').value,
        type = newContact.get();

    if (type === 'phone' || type === 'fax')
      contact = cleanPhoneNumber(contact);

    newContact.set();

    Meteor.call('user add contact', type, contact, function(err){
      if (err)
        Messages.info(err.reason);
      else {
        Messages.info('Контакт добавлен ' + contact);
        buildQRCode();
      }
    });
    return false;
  },
});

/* ****************************************************

 QR код VCARD-а

 **************************************************** */

var qrcode;

Template.profileQRcode.helpers({
  user: function() {
    Meteor.user();
  }
});

function buildQRCode () {
  var vcard = userVCARD();
  
  qrcode.makeCode(vcard);
  console.log('vcard:\n%s', vcard);
}

Template.profileQRcode.rendered = function(){
  this.$('[data-toggle="popover"]').popover();

  qrcode = new QRCode(document.getElementById("qr-profile"), {
    width : 200,
    height : 200,
    colorDark : "green",
    colorLight : "#ffffff",
    correctLevel : QRCode.CorrectLevel.M,
  });

  buildQRCode();

};

/* ****************************************************

 Вспомагательный шаблон, номер телефона ввода

 **************************************************** */
Template.profileInputHelperPhone.rendered = function(){
  // Инициализация bootstrap-phone-helper
  var $phone = this.$('.bfh-phone');
  $phone.bfhphone($phone.data());
};

