Meteor.startup(function () {
  if (typeof Throttle !== 'undefined') 
    Throttle.debug = false;
});

Accounts.registerLoginHandler(function(loginRequest) {
  if(loginRequest.pwd && loginRequest.phone) {

    // 10ть попыток в 60 секунд
    if (!Throttle.checkThenSet('signIn.' + 
                               headers.methodClientIP(this), 10, 60000))
      return {
        error: new Meteor.Error(500,
                                '<strong>Превышено количество попыток входа.</strong>' +
                                'Возможно вам следует восстановить пароль или попробуйте позже') };

    var ERRMSG = "<strong>Войти не удалось.</strong> Проверьте правильность логина и пароля.";
    var user = Meteor.users.findOne({"profile.phone": loginRequest.phone});
    if(!user) {
      return {
        error: new Meteor.Error(403, ERRMSG)
      };
    } else {
      if (user.password !== loginRequest.pwd) {
        return {
          userId: user._id,
          error: new Meteor.Error(403, ERRMSG)
        };
      } else {
        console.log('User logged %s IP: %s', loginRequest.phone, headers.methodClientIP(this));
        return {
          userId: user._id,
        };
      }
    }
  }
  return undefined;
});

var sendSMS = function (message, phone) {
  if (typeof Accounts.sendSMS === 'function')
    Accounts.sendSMS(message, phone);
  else {
    throw new Meteor.Error(400, "Account.sendSMS must be defined as function");
  }
}

var createUserPhone = function (phone, fullName) {
  check(fullName, String);

  if (!fullName && !phone)
    throw new Meteor.Error(400, "Need to set a fullName or phone");

  if (phone && fullName) {
    var user = Meteor.users.findOne({"profile.phone": phone});
    // create user
    if (!user) {
      var password = Random.id(6); 
      var message =
          "Регистрация на молдавстройбат\n" +
          "Логин: " + phone + "\n" +
          "Пароль: " + password;

      sendSMS(message, phone);

      return Accounts.insertUserDoc(
        {},
        { profile: {phone: phone,
                    completeName: fullName},
          password: SHA256(password)
        });
    } else {
      throw new Meteor.Error(403, "Этот номер уже используется. Если это ваш номер, Вы можете восстановить пароль");
    }
  } else
    throw new Meteor.Error (400, 'phone and fullName required for createUserPhone');
};

Meteor.methods({registerUserPhone: function (phone, fullName) {
  // 3 попыток в 60 секунд, этого должно хватить чтобы вспомнить и таки ввести тот самый телефон
  if (!Throttle.checkThenSet('signUp.' + 
                             headers.methodClientIP(this), 3, 60000))
    throw new Meteor.Error(500, '<strong>Превышено количество.</strong> Попробуйте позже.');

  return createUserPhone(phone, fullName);
}});

// send reset token if @resetToken not defined
Meteor.methods({resendPasswordSMS: function (phone, confirmToken) {
  check(phone, String);

  // 5ть попыток в минуту только
  if (!Throttle.checkThenSet('resendPwd.' + 
                             headers.methodClientIP(this), 5, 60000))
    throw new Meteor.Error(500, 'Похоже вы не можете вспомнить свой телефон, подождите немного, и попробуйте снова :)');

  var user = Meteor.users.findOne({"profile.phone": phone});
  if (!user) {
    throw new Meteor.Error(403, "Проверьте правильность ввода номера.");
  } else {
    if (!confirmToken) {
      var resetToken = Random.id(6);

      Meteor.users.update(user._id,
                          {$set: {'services.reset.pwd': resetToken}});
      var message =
            "Для получения нового пароля введите этот код на сайте: " + resetToken;
      sendSMS(message, phone);

    } else {
      if (user.services.reset.pwd === confirmToken) {
        var newPassword = Random.id(6);
      
        Meteor.users.update(user._id,
                            {$set: {password: SHA256(newPassword)}});
        sendSMS("Пароль сброшен.\nНовый пароль: " + newPassword,
                phone);
      } else {
        throw new Meteor.Error(403, "Проверочный код введён неверно.");
      }
    }
  }
}});

// дополнительный индекс в базе
Meteor.users._ensureIndex('profile.phone', {unique: 1, sparse: 1});
