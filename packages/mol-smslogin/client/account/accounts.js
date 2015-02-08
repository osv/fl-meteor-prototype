function isNotEmpty(val) {
  if (!val || val === ''){
    return false;
  }
  return true;
}

function cleanPhoneNumber(phone) {
  return phone.replace(/[-+ ()]/g, '');
}

Template.loginButton.helpers({
  dropDownMenus: function(){
    return Accounts.dropDownMenus;
  },
  displayName: function(){
    var user = Meteor.user();
    return (user.profile && user.profile.completeName) || (user.profile && user.profile.phone);
  },
  alertMessage: function(){
    return Session.get('alertMessage');
  },
  infoMessage: function(){
    return Session.get('infoMessage');
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
    Session.set('alertMessage', '');
    Session.set('infoMessage', '');
}

// Login Form Events
Template.loginButton.events({
  'click #signIn': function(){
    clrAlerts();
    Session.set('loginForm', 'loginSignIn');
  },
  'click #signUp': function(){
    clrAlerts();
    Session.set('loginForm', 'loginSignUp');
  },
  'click #reg': function(){
    clrAlerts();
    Session.set('loginForm', 'loginSignUp');
  },
  'click #restore': function(){
    Session.set('loginForm', 'loginResend');
  },
  'click #login-phone':function(){
    $('#login-phone-fgrp').removeClass("has-error");
  },
  'click #login-name':function(){
    $('#login-name-fgrp').removeClass("has-error");
  },
  'submit #login-sign-in-form': function(e, t) {
    e.preventDefault();
    var phone = t.find('#login-phone').value,
        password = t.find('#login-password').value;
    phone = cleanPhoneNumber(phone);
    clrAlerts();
    if (!phone.match(/^\d{11,12}$/)) { // 11 или 12 цифр, (в укр 12)
      Session.set('alertMessage', 'Проверьте правильность ввода номера.');
      $('#login-phone-fgrp').addClass("has-error");
      return false;
    }
    if (isNotEmpty(password))
    {
      $('fieldset').prop('disabled', true);
      Meteor.loginWithPhone(phone, password, function(err){
        $('fieldset').prop('disabled', false);
        if (err) {
          Session.set('alertMessage', err.reason);
        } else {
          $('#loginModal').modal('hide'); //скрываем модальное окно, залогинились уже
        }
      });
    }
    return false;
  },
  'submit #login-sign-up-form': function(e, t) {
    e.preventDefault();
    var phone = t.find('#login-phone').value,
        fullName = t.find('#login-name').value;
    var clearPhone = cleanPhoneNumber(phone); //телефон без пробелов, минусов, плюсов, скобок
    clrAlerts();
    if (!clearPhone.match(/^\d{11,12}$/)) { // 11 или 12 цифр, (в укр 12)
      Session.set('alertMessage', 'Проверьте правильность ввода номера.');
      $('#login-phone-fgrp').addClass("has-error");
      return false;
    }
    // подсветим ошибку если не выделено заказчик или исполнитель
    if (! $('#customer').prop('checked') &&
        ! $('#master').prop('checked') ) {
      $('#switch-fgrp').addClass("has-error");
      $('#switch-fgrp .btn').removeClass("btn-default");
      $('#switch-fgrp .btn').addClass("btn-danger");
      Session.set('alertMessage', 'Вы должны выбрать вашу роль');
      return false;
    }

    var masterOrCustomer = $('#master').prop('checked');

    if (!isNotEmpty(fullName)) {
      Session.set('alertMessage', 'Укажите как к Вам можно обращаться');
      $('#login-name-fgrp').addClass("has-error");
      return false;
    }
    $('#login-name-fgrp').removeClass("has-error");
    if (isNotEmpty(clearPhone))
    {
      $('fieldset').prop('disabled', true);
      Meteor.call('registerUserPhone', clearPhone, fullName, masterOrCustomer, function(err, id) {
        $('fieldset').prop('disabled', false);
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
  'submit #login-resetToken': function(e, t) {
    e.preventDefault();
    var phone = t.find('#login-phone').value;
    phone = cleanPhoneNumber(phone);
    clrAlerts();
    if (!phone.match(/^\d{11,12}$/)) {
      Session.set('alertMessage', 'Проверьте правильность введенного номера.');
      return false;
    }
    $('#login-phone').prop('disabled', true);
    $('#resetFormTokenSend').hide();
    Meteor.call('resendPasswordSMS', phone, function (err) {
      if (err) {
        Session.set('alertMessage', err.reason);
        $('#login-phone').prop('disabled', false);
        $('#resetFormTokenSend').show();
      } else {
        $('#login-resetPassword').show();
        Session.set('infoMessage', 'На Ваш номер отправлено сообщение с кодом для сброса пароля.');
      }
    });
    return false;
  },
  'submit #login-resetPassword': function(e, t) {
    e.preventDefault();
    var phone = t.find('#login-phone').value,
        resetToken = t.find('#login-token').value;
    phone = cleanPhoneNumber(phone);
    if (!phone.match(/^\d{11,12}$/))
      return false;
    if (isNotEmpty(resetToken)) {
      $('fieldset').prop('disabled', true);
      Meteor.call('resendPasswordSMS', phone, resetToken, function(err) {
        $('fieldset').prop('disabled', false);
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
  'focus #login-phone, focus #login-password, focus #login-name': function(e, t) {
    clrAlerts();
  },
  'focus #login-restore-password, focus #login-token': function(e, t) {
    clrAlerts();
  },
  'click #logout' : function() {
    Meteor.logout();
    return false;
  }
});

Template.bsSwitchMaster.events({
  'click .input-group':function(){
    $('#switch-fgrp').removeClass("has-error");
    $('#switch-fgrp .btn').addClass("btn-default");
    $('#switch-fgrp .btn').removeClass("btn-danger");
    clrAlerts();
  },
});

Template.bsInputHelperPhone.rendered = function () {
  // this.data это дата контекст теплейта {{ > bsInputHelper id=foo }} this.data.id='foo'
  var $phone = $('#' + this.data.id + '.bfh-phone');
  $phone.bfhphone($phone.data()); // Инициализация bootstrap-phone-helper
};

Template.bsInputHelper.helpers({
  type: function() { return this.type || 'text'; }
});

Template.loginSignIn.rendered = function () {
  // Установим телефон в форме логина с формы регистрации, он в currenPhone
  var phone = Session.get('currenPhone');
  if (isNotEmpty(phone)) {
    $('#login-phone').val(phone);
  }
};

Template.loginSignUp.rendered = function () {
  // автоскрытие поповера после 6сек
  $('#login-phone').popover({content: 'Ваш телефон будет использован только для входа на сайт. При желании вы можете указать его как контактный.',
                             placement: 'top'});
  $('#login-phone').on('shown.bs.popover', function () {
    setTimeout(function () {
      $('#login-phone').popover('hide');
    }, 6500);
  });
};
