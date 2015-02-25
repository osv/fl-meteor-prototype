function isNotEmpty(val) {
  if (!val || val === ''){
    return false;
  }
  return true;
}

function cleanPhoneNumber(phone) {
  return phone.replace(/[-+ ()]/g, '');
}

function isPhoneValid(phone) {
  if (phone.match(/^380\d{9}$/))
    return true;
  else
    if (phone.match(/^7\d{10}$/))
      return true;
  return false;
};

// Set authLoading session variable and disabled prop of given form's fieldname
// Статус загрузки.
function setLoading(formID, bStatus) {
  Session.set('authLoading', bStatus);
  $('#' + formID + ' fieldset').prop('disabled', bStatus);
}

Template.loginButton.helpers({
  dropDownMenus: function(){
    return Accounts.dropDownMenus;
  },
  displayName: function(){
    var user = Meteor.user();
    return (user.profile && user.profile.completeName) || (user.profile && user.phone);
  },
  alertMessage: function(){
    return Session.get('alertMessage');
  },
  infoMessage: function(){
    return Session.get('infoMessage');
  },
  isLoading: function() {
    return Session.get('authLoading');
  },
  // выбор формочки в зависимости от сессионой перем. loginForm
  curLoginForm: function(){
    return Session.get('loginForm') || 'loginSignIn';
  },
  loginFormTitle: function() {
    switch (Session.get('loginForm')) {
      case 'loginResend': return 'Восстановление пароля';
      case 'loginSignUp': return 'Регистрация';
      default: return 'Вход';
    }
  }
});

// очищает алерты и инфобокс в логин окне
function clrAlerts() {
  Session.set('authLoading', false);
  Session.set('alertMessage', '');
  Session.set('infoMessage', '');
}

Template.loginButton.events({
  'click #signIn': function(){
    clrAlerts();
    Session.set('loginForm', 'loginSignIn');
  },
  'click #signUp': function(){
    clrAlerts();
    Session.set('loginForm', 'loginSignUp');
  },
  'keypress input, click button': function(e, t) {
    clrAlerts();
  },
  'click #logout' : function() {
    Meteor.logout();
    Router.go('/');
    return false;
  }
});

/* Вход */

Template.loginSignIn.rendered = function () {

  // Установим телефон в форме логина с формы регистрации, он в currenPhone
  var phone = Session.get('currenPhone');
  if (isNotEmpty(phone)) {
    this.$('[name="phone"]').val(phone);
  } 

  this.$('#formSignIn').formValidation({
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
      password: {
        validators: {
          notEmpty: {
            message: 'Введите пароль'
          }
        }
      }
    }
  })
    .on('success.form.fv', function(e, data) {
      // Prevent form submission
      // http://formvalidation.io/examples/form-submit-twice/
      e.preventDefault();
    });
};

Template.loginSignIn.events({
  'click #reg': function(){
    clrAlerts();
    Session.set('loginForm', 'loginSignUp');
  },
  'click #restore': function(){
    clrAlerts();
    Session.set('loginForm', 'loginResend');
  },
  'submit #formSignIn': function(e, t) {
    e.preventDefault();

    var cleanPhone = cleanPhoneNumber(t.find('[name="phone"]').value),
        password = t.find('[name="password"]').value;

    clrAlerts();

    t.$('#formSignIn').data('formValidation').validate();
    if (!t.$('#formSignIn').data('formValidation').isValid())
      return false;

    setLoading('formSignIn', true);
    Meteor.loginWithPhone(cleanPhone, password, function(err){
      setLoading('formSignIn', false);
      if (err) {
        Session.set('alertMessage', err.reason);
      } else {
        $('#loginModal').modal('hide'); //скрываем модальное окно, залогинились уже
      }
    });
    return false;
  },
});

/* Регистрация */

Template.loginSignUp.rendered = function() {

  // автоскрытие поповера после 6сек
  $('[name="phone"]').popover({content:
                             'Ваш телефон будет использован только для входа на сайт.'+
                             ' При желании вы можете указать его как контактный позже.',
                             placement: 'top'})
    .on('shown.bs.popover', function () {
      setTimeout(function () {
        $('[name="phone"]').popover('hide');
      }, 6500);
  });

  this.$('#formSignUp').formValidation({
    trigger: null,
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
      name: {
        validators: {
          notEmpty: {
            message: "Поле не может быть пустым"
          },
          stringLength: {
            min: 2,
            max: 58,
            message: "ФИО не должно быть больше 58 символов",
          }
        }
      },
      status: {
        validators: {
          notEmpty: {
            message: "Вы должны выбрать вашу роль на сайте"
          }
        }}}})
    .on('success.form.fv', function(e, data) {
      e.preventDefault();
    });
};

Template.loginSignUp.events({
  'submit #formSignUp': function(e, t) {
    e.preventDefault();
    var phone = t.find('[name="phone"]').value,
        clearPhone = cleanPhoneNumber(phone), //телефон без пробелов, минусов, плюсов, скобок
        fullName = t.find('[name="name"]').value;

    clrAlerts();

    t.$('#formSignUp').data('formValidation').validate();
    if (!t.$('#formSignUp').data('formValidation').isValid())
      return false;

    var masterOrCustomer = $('#master').prop('checked');

    if (!isNotEmpty(fullName)) {
      return false;
    }

    if (isNotEmpty(clearPhone))
    {
      setLoading('formSignUp', true);
      Meteor.call('registerUserPhone', clearPhone, fullName, masterOrCustomer, function(err, id) {
        setLoading('formSignUp', false);
        if (err) {
          Session.set('alertMessage', err.reason);
        } else {
          clrAlerts();
          Session.set('infoMessage', "Вы зарегистрированы как <strong>" +
                      (masterOrCustomer ? "исполнитель" : "заказчик") +
                      "</strong> На Ваш номер отправлено сообщение с паролем.");
          Session.set('loginForm', 'loginSignIn');
          Session.set('currenPhone', phone);
        }
      });
    }
    return false;
  },
});

/* Востановление пароля */

Template.loginResend.rendered = function() {

  this.$('#formSendToken').formValidation({
    fields: {
      phone: {
        validators: {
          callback: {
            callback: function(value) {
              return isPhoneValid( cleanPhoneNumber( value ) );
            },
            message: 'Проверьте правильность ввода номера'
          }}}}})
    .on('success.form.fv', function(e, data) {
      e.preventDefault();
    });

  $('#formResetPassword').formValidation({
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
          }}}}})
    .on('success.form.fv', function(e) {
    e.preventDefault();
  });

};

Template.loginResend.events({
  'submit #formSendToken': function(e, t) {
    e.preventDefault();
    var cleanPhone = cleanPhoneNumber(t.find('[name="phone"]').value);

    clrAlerts();

    t.$('#formSendToken').data('formValidation').validate();
    if (!t.$('#formSendToken').data('formValidation').isValid())
      return false;

    setLoading('formSendToken', true);
    Meteor.call('resendPasswordSMS', cleanPhone, function (err) {
      setLoading('formSendToken', false);
      if (err) {
        Session.set('alertMessage', err.reason);
      } else {
        t.$('#formResetPassword').show();
        t.$('#formSendToken fieldset').prop('disabled', true); // предыдущую формочку блокируем
        Session.set('infoMessage', 'На Ваш номер отправлено сообщение с кодом для сброса пароля.');
      }
    });
    return false;
  },
  'submit #formResetPassword': function(e, t) {
    e.preventDefault();
    var phone = t.find('[name="phone"]').value,
        cleanPhone = cleanPhoneNumber(phone),
        resetToken = t.find('[name="token"]').value;

    t.$('#formResetPassword').data('formValidation').validate();
    if (!t.$('#formResetPassword').data('formValidation').isValid())
      return false;

    if (isNotEmpty(resetToken)) {
      setLoading('formSendToken', true);
      Meteor.call('resendPasswordSMS', cleanPhone, resetToken, function(err) {
        setLoading('formSendToken', false);
        if (err) {
          Session.set('alertMessage', err.reason);
        } else {
          Session.set('infoMessage', 'На Ваш номер отправлено сообщение с новым паролем.');
          Session.set('loginForm', 'loginSignIn');
          Session.set('currenPhone', phone);
        }
      });
    }
    return false;
  },
});

Template.bsInputHelperPhone.rendered = function () {
  // Инициализация bootstrap-phone-helper
  // здесь this.$ это jquery  селектор, но только в пределах шаблона
  var $phone = this.$('.bfh-phone');
  $phone.bfhphone($phone.data());
};

Template.bsInputHelper.helpers({
  type: function() { return this.type || 'text'; }
});
