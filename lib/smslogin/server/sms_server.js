Accounts.registerLoginHandler(function(loginRequest) {

  if(loginRequest.pwd && loginRequest.phone) {
    var user = Meteor.users.findOne({phone: loginRequest.phone});
    if(!user) {
      return {
        error: new Meteor.Error(403, "Пользователь не найден")
      };
    } else {
      if (user.password !== loginRequest.pwd) {
        return {
          userId: user._id,
          error: new Meteor.Error(403, "Не правильный пароль")
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

var createUserPhone = function (phone, fullName) {
  console.log('ok, try create new account ' + fullName);
  check(fullName, String);

  if (!fullName && !phone)
    throw new Meteor.Error(400, "Need to set a fullName or phone");

  if (phone && fullName) {
    var user = Meteor.users.findOne({phone: phone});
    // create user
    if(!user) {
      console.log("Create new user " + fullName);

      // TODO: покачто не рандомный пароль
      var password = 'user'; 
      // TODO: send sms
      
      return Accounts.insertUserDoc(
        {},
        { phone: phone,
          fullName: fullName,
          password: SHA256('user')
        });
    } else {
      throw new Meteor.Error(403, "Пользователь с этим телефоном уже зарегистрирован");
    }
  } else
    throw new Meteor.Error (403, 'phone and fullName required for createUserPhone');
};

Meteor.methods({registerUserPhone: function (phone, fullName) {
  return createUserPhone(phone, fullName);
}});

// дополнительный индекс в базе
Meteor.users._ensureIndex('phone', {unique: 1, sparse: 1});

