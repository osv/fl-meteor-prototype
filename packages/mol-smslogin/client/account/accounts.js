function isNotEmpty(val) {
  if (!val || val === ''){
    return false;
  }
  return true;
}

function cleanPhoneNumber(phone) {
  console.log('Phone before: ' + phone);
  console.log('Phone after : ' + phone.replace(/[-+ ()]/g, ''));
  return phone.replace(/[-+ ()]/g, '');
}

Template.loginButton.helpers({
  displayName: function(){
    
    var user = Meteor.user();
    console.log(JSON.stringify(user));
    return (user.profile && user.profile.completeName) || (user.profile && user.profile.phone);
  },
  alertMessage: function(){
    return Session.get('alertMessage');
  },
  infoMessage: function(){
    return Session.get('infoMessage');
  },
  // выбор формочки в зависимости от сессионой перем. loginForm
  loginForm: function(){
    switch (Session.get('loginForm')) {
      case 'loginResend': return Template.loginResend;
      case 'loginSignUp': return Template.loginSignUp;
      default: return Template.loginSignIn;
    }
  },
  loginFormTitle: function() {
    switch (Session.get('loginForm')) {
      case 'loginResend': return 'Востановление пароля';
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
    console.log('click1');
    clrAlerts();
    Session.set('loginForm', 'loginSignIn');
  },
  'click #signUp': function(){
    console.log('click2');
    clrAlerts();
    Session.set('loginForm', 'loginSignUp');
  },
  'click #reg': function(){
    console.log('click3');
    clrAlerts();
    Session.set('loginForm', 'loginSignUp');
  },
  'click #restore': function(){
    console.log('click4');
    Session.set('loginForm', 'loginResend');
  },
  'submit #login-sign-in-form': function(e, t) {
    e.preventDefault();
    console.log("Signin");
    var phone = t.find('#login-phone').value,
        password = t.find('#login-password').value;
    phone = cleanPhoneNumber(phone);
    clrAlerts();
    if (isNotEmpty(phone) &&
        isNotEmpty(password))
    {
      $('fieldset').prop('disabled', true);
      Meteor.loginWithPhone(phone, password, function(err){
        $('fieldset').prop('disabled', false);
        if (err) {
          Session.set('alertMessage', err.reason);
          console.warn("login fail " + err.reason);
          console.log("session: " + Session.get('infoMessage'));
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
      Session.set('alertMessage', 'Телефон должен содержать цифры: "+79.."');
      return false;
    }
    if (!isNotEmpty(fullName)) {
      Session.set('alertMessage', 'Пожалуйста, укажите как к вам могут обращаться');
      return false;
    }
    if (isNotEmpty(clearPhone))
    {
      $('fieldset').prop('disabled', true);
      Meteor.call('registerUserPhone', clearPhone, fullName, function(err, id) {
        $('fieldset').prop('disabled', false);
        if (err) {
          Session.set('alertMessage', err.reason);
          console.warn("fail create user: " + err.reason);
        } else {
          clrAlerts();
          Session.set('infoMessage', "SMS отправлен с паролем");
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
      Session.set('alertMessage', 'Телефон должен содержать цифры: "+79.."');
      return false;
    }
    $('#login-phone').prop('disabled', true);
    $('#resetFormTokenSend').hide();
    Meteor.call('resendPasswordSMS', phone, function (err) {
      if (err) {
        console.log(err);
        Session.set('alertMessage', err.reason);
        $('#login-phone').prop('disabled', false);
        $('#resetFormTokenSend').show();
      } else {
        $('#login-resetPassword').show();
        Session.set('infoMessage', 'Отправлен SMS с кодом, введите его ниже');
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
          Session.set('infoMessage', 'Отправлен SMS с новым паролем');
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

Template.bsInputHelperPhone.rendered = function () {
  // this.data это дата контекст теплейта {{ > bsInputHelper id=foo }} this.data.id='foo'
  var $phone = $('#' + this.data.id + '.bfh-phone');
  $phone.bfhphone($phone.data()); // Инициализация bootstrap-phone-helper
};

Template.bsInputHelper.helpers({
  type: function() { return this.type || 'text'; }
});

Template.loginSignIn.rendered = function () {
  var phone = Session.get('currenPhone');
  if (isNotEmpty(phone)) {
    $('#login-phone').val(phone);
  }
  console.log('set phone ' + phone);
};
