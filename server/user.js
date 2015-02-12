// устанавливаем хуки от sms-login
Accounts.registerHook.push(function(user, id) {
  logEvent({type: Events.EV_USERLOGIN, name: 'User register',
            userId: id, desc: 'Телефон: ' + user.phone});
});
Accounts.loginHook.push(function(user, ip) {
  logEvent({type: Events.EV_USERLOGIN, name: 'User logged',
            userId: user._id, desc: 'IP address: ' + ip + '\nName: ' + user.profile.completeName});
});
Accounts.resetPasswordHook.push(function(user) {
  logEvent({type: Events.EV_USERLOGIN, name: 'User reset pwd request',
            userId: user._id});
});
Accounts.resettedPasswordHook.push(function(user) {
  logEvent({type: Events.EV_USERLOGIN, name: 'User reset pwd request done',
            userId: user._id });
});

Meteor.publish('currentUser', function() {
  var user = Meteor.users.find({_id: this.userId},
                               {fields: {
                                 isMaster: true,
                                 isAdmin: true,
                                 phone: true}});
  return user;
});

Meteor.methods({
  // token -  опционально, если undefined, тогда  отправляем SMS, если
  // же есть, тогда проверяем и меняем номер телефона юзера this.userId
  'change login phone': function(phone, token) {
    check(phone, String);

    if (!this.userId)
      throw new Meteor.Error(401, 'User not logged in');

    // 5ть попыток в 2 минуты только
    if (!Throttle.checkThenSet('changePhone.' + this.userId, 5, 120000))
      throw new Meteor.Error(500, 'Превышено количество попыток, подождите немного.');

    var user = Meteor.users.findOne(this.userId, {fields: {services: 1, phone: 1}});

    if (!user)
      throw new Meteor.Error(500);

    // не позволим поменять телефон на тот который уже есть у другого пользователя
    // даж если создал он фейк, то пускай поменяет сперва один телефон на другой.
    if (Meteor.users.findOne({phone: phone}))
      throw new Meteor.Error(500, 'Ошибка, проверьте номер');

    if (_.isUndefined(token)) {
      var changeToken = Random.id(6);

      Meteor.users.update(this.userId,
                          {$set: {'services.change.phone': phone,
                                  'services.change.token': changeToken}});

      sendSMS("Подтвердите смену телефона на номер: " + 
              phone + "\n" +
              "Код: " + changeToken,
              phone);

      logEvent({type: Events.EV_PROFILE, userId: this.userId, name: "Phone change",
                desc: "Request for phone change from " + user.phone + " to " + phone});

    } else {
      if (token !== user.services.change.token)
        throw new Meteor.Error(403, "Не правильный код, проверьте его.");

      Meteor.users.update( this.userId,
                           {$set: {
                             phone: user.services.change.phone },
                            $unset: { 'services.change': "" }} );
      logEvent({type: Events.EV_PROFILE, userId: this.userId, name: "Phone change",
                desc: "Changed phone. Old " + user.phone + ". New " + user.services.change.phone});
    }
  },
  'change password': function(oldPassword, newPassword) {
    check(oldPassword, String);
    check(newPassword, String);

    if (!this.userId)
      throw new Meteor.Error(401, 'User not logged in');

    if (!newPassword.match(/[a-zA-Z0-9+_,./-]{6,}/))
      throw new Meteor.Error(403, "Пароль должен содержать минимум 6 символов, содержать символы латыни и цифры.");

    var user = Meteor.users.findOne(this.userId, {fields: {password: 1}});

    if (SHA256(oldPassword) === user.password) {
      var currentLoginToken = Accounts._getLoginToken(this.connection.id);
      Meteor.users.update(this.userId,
                          {
                            $set: {password: SHA256(newPassword)},
                            // удаляем логин токены кроме текущего аналогично accounts-password/password_server.js
                            $pull: {
                              'services.resume.loginTokens': { hashedToken: { $ne: currentLoginToken } }}
                          });
      logEvent({type: Events.EV_PROFILE, name: "Changed password", userId: this.userId});
    } else
      throw new Meteor.Error(403, "Вы ввели не правильный ваш старый пароль.");
  },
  'change user name': function(fullName) {
    check(fullName, String);

    if (!this.userId)
      throw new Meteor.Error(401, 'User not logged in');

    if (fullName.length < 2)
      throw new Meteor.Error(403);

    var user = Meteor.users.findOne(this.userId, {fields: {"profile.completeName": 1}});

    Meteor.users.update(this.userId, {$set: {"profile.completeName": fullName}});
    logEvent({type: Events.EV_PROFILE, name: "Changed name", userId: this.userId,
              desc: "Name changed from " + user.profile.completeName + " to " + fullName});
  },
  'change user describe long': function(workDescribe) {
    check(workDescribe, String);

    if (!this.userId)
      throw new Meteor.Error(401, 'User not logged in');

    Meteor.users.update(this.userId, {$set: {"profile.dLong": workDescribe}});
    logEvent({type: Events.EV_PROFILE, name: "Changed describe", userId: this.userId,
              desc: "Work long describe: " + workDescribe + " to " + workDescribe});
  },
  'change user describe short': function(workDescribe) {
    check(workDescribe, String);

    if (!this.userId)
      throw new Meteor.Error(401, 'User not logged in');

    Meteor.users.update(this.userId, {$set: {"profile.dShort": workDescribe}});
    logEvent({type: Events.EV_PROFILE, name: "Changed preview", userId: this.userId,
              desc: "Work short describe: " + workDescribe + " to " + workDescribe});
  }

});

Meteor.startup(function() {

  /*  Создадим админа если его нет с паролем admin */
  var MASTERPHONE = '380123456789';
  var admin = Meteor.users.findOne({phone: MASTERPHONE});
  if (!admin) {
    admin = Accounts.insertUserDoc( {},
                                    { phone: MASTERPHONE,
                                      profile: {
                                        completeName: 'Администрация'},
                                      password: SHA256('admin'),
                                      isAdmin: true,
                                    });
    console.warn('First run?');
    console.warn('I create admin user for you: %s\n     пароль: admin', MASTERPHONE);
  }
});
