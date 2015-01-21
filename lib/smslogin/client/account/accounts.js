function isNotEmpty(val) {
  if (!val || val === ''){
    return false;
  }
  return true;
}

function cleanPhoneNumber(phone) {
  return phone.replace(/[+ -()]/g, '');
}

Template.loginButton.helpers({
  alertMessage: function(){
    return Session.get('alertMessage');
  },
  infoMessage: function(){
    return Session.get('infoMessage');
  },
  loginForm: function(){
    console.log('loginForm ' + Session.get('loginForm'));
    switch (Session.get('loginForm')) {
      case 'loginResend': return Template.loginResend;
      case 'loginSignUp': return Template.loginSignUp;
      default: return Template.loginSignIn;
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
    if (isNotEmpty(phone) &&
        isNotEmpty(password))
    {
      Meteor.loginWithPhone(phone, password, function(err){
        if (err) {
          Session.set('alertMessage', "Ошибка " + err.reason);
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
    var phone = t.find('#login-create-phone').value,
        fullName = t.find('#login-create-name').value;
    phone = cleanPhoneNumber(phone);
    if (!phone.match('^\\d{12}')) {
      Session.set('alertMessage', 'Телефон должен содержать цифры: "+380.."');
    }
    if (isNotEmpty(phone) &&
        isNotEmpty(fullName))
    {
      Meteor.call('registerUserPhone', phone, fullName, function(err, id) {
        if (err) {
          Session.set('alertMessage', "Ошибка " + err.reason);
          console.warn("fail create user: " + err.reason);
        } else {
          clrAlerts();
          Session.set('loginForm', 'loginSignIn');
          Session.set('infoMessage', "SMS отправлен с паролем");
        }
      });
    }
    return false;
  },
  'submit #login-reset-form': function(e, t) {
    e.preventDefault();
    var phone = t.find('#login-restore-password').value;
    phone = cleanPhoneNumber(phone);
    if (!phone.match('^[+]?\\d{12}')) {
      Session.set('alertMessage', 'Телефон должен содержать цифры: "+380.."');
    }
    if (isNotEmpty(phone) &&
        isNotEmpty(fullName))
    {
      // TODO: ресет пароля
    }
    return false;
  },
  'focus #login-phone, focus #login-password': function(e, t) {
    clrAlerts();
  },
  'focus #login-create-name, focus #login-create-phone': function(e, t) {
    clrAlerts();
  },
  'focus #login-restore-password': function(e, t) {
    clrAlerts();
  },
  'click #logout' : function() {
    Meteor.logout();
    return false;
  }
});
