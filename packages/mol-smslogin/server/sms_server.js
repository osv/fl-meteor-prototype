Accounts.registerLoginHandler(function(loginRequest) {

  if(loginRequest.pwd && loginRequest.phone) {
    var user = Meteor.users.findOne({"profile.phone": loginRequest.phone});
    if(!user) {
      return {
        error: new Meteor.Error(403, "Войти не удалось. Проверьте правильность логина и пароля.")
      };
    } else {
      if (user.password !== loginRequest.pwd) {
        return {
          userId: user._id,
          error: new Meteor.Error(403, "Войти не удалось. Проверьте правильность логина и пароля.")
        };
      } else {
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
  console.log('ok, try create new account ' + fullName);
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
  return createUserPhone(phone, fullName);
}});

// send reset token if @resetToken not defined
Meteor.methods({resendPasswordSMS: function (phone, confirmToken) {
  check(phone, String);

  var user = Meteor.users.findOne({"profile.phone": phone});
  if (!user) {
    throw new Meteor.Error(403, "");
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
