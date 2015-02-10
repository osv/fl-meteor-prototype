/*
 Пояснения:

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

/* ****************************************************
 
 Шаблон смены логин телефон

***************************************************** */

Template.profileLoginPhone.helpers({
  currentPhone: function() {
    return formatPhone('' + Meteor.user().phone);
  },
});

Template.profileLoginPhone.rendered = function(){
  this.$('[data-toggle="popover"]').popover();
};

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

 Шаблон смены пароля

 **************************************************** */
Template.profileChangePassword.rendered = function() {
  this.$('[data-toggle="popover"]').popover();
};

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
    if (newPwd2 !== newPwd2)
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

 Вспомагательный шаблон, номер телефона ввода

 **************************************************** */
Template.profileInputHelperPhone.rendered = function(){
  // Инициализация bootstrap-phone-helper
  var $phone = this.$('.bfh-phone');
  $phone.bfhphone($phone.data());
};

