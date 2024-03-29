var MASTERPHONE = '380123456789'; // телефон-логин для адмира который будет создан

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
                                 createdAt: false,
                                 services: false}});
  return user;
});

Meteor.publish('UserCats', function() {
  return UserCats.find({u: this.userId});
});

/*

 Recalucalte score points for @user. We use this points for sorting them in catalogs

 Все равны, но коекто равнее.

 По какимто ж критериям нужно сортировать юзеров, например на странице
 "мастера" мы выборку сделали по  г. Москва. Дополнительное поле score
 в юзере  указывает на сколько  заполнен профиль и тд.   Для концепции
 "про"  - просто  добавляем  +10500  к score,  и  они будут  автоматом
 первыми. При этом потребуется простой индекс в базе.

 формула:

 min(10, 2 * колич.галерей) +
 min(5, размер описание профиля / 100) +
 2 если размер краткого описание > 20 символ +
 1 если вебсайт указан + 
 10 если есть контакты +
 5 если есть аватар +
 2 если указан частное лицо или тд.

 */
recalculateUserScore = function(user) {
  if (_.isString(user))
    user = Meteor.users.findOne(user);
  else if (typeof user === 'undefined') 
    user = Meteor.user();

  if (!user)
    return false;

  var score = 
        Math.min(10, (user.gal ? 2 * user.gal.length : 0)) +
        Math.min(5, (user.dLong) ? (user.dLong.length / 100) : 0) +
        ((user.profile && user.profile.dShort && // если краткое описание больше 10 символово.
          user.profile.dShort.length > 20) ?       2  : 0) +
        ((user.profile && user.profile.website)  ? 1  : 0) +
        ((user.profile && user.profile.contacts &&
          user.profile.contacts.length) ?          10 : 0) +
        ((user.profile && user.profile.avatar)   ? 5  : 0) +
        ((user.legalStat)                        ? 2  : 0);
  /* TODO: нужно отзывы также будет сюда добавить */
  /* TODO: isPro если он "про" то добавить 105000 */
  // TODO: обновить score в UserCats, а в Meteor.users випилить

  Meteor.users.update(user._id, {$set: {score: parseInt(score)}});
  return true;
};

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

    var user = Meteor.users.findOne(this.userId, {fields: {"profile.completeName": 1}});

    Meteor.users.update(this.userId, {$set: {"profile.completeName": fullName}});
    logEvent({type: Events.EV_PROFILE, name: "Changed name", userId: this.userId,
              desc: "Name changed from " + user.profile.completeName + " to " + fullName});
  },
  'change user describe long': function(workDescribe) {
    check(workDescribe, String);

    if (!this.userId)
      throw new Meteor.Error(401, 'User not logged in');

    if (Meteor.users.update(this.userId, {$set: {"dLong": workDescribe}})) {
      recalculateUserScore(this.userId);
      logEvent({type: Events.EV_PROFILE, name: "Changed describe", userId: this.userId,
                desc: "Work long describe: " + workDescribe + " to " + workDescribe});
    }
  },
  'change user describe short': function(workDescribe) {
    check(workDescribe, String);

    if (!this.userId)
      throw new Meteor.Error(401, 'User not logged in');

    if (Meteor.users.update(this.userId, {$set: {"profile.dShort": workDescribe}})) {
      recalculateUserScore(this.userId);
      logEvent({type: Events.EV_PROFILE, name: "Changed preview", userId: this.userId,
              desc: "Work short describe: " + workDescribe + " to " + workDescribe});
    }
  },
  'change user website': function(website) {
    check(website, String);

    if (!this.userId)
      throw new Meteor.Error(401, 'User not logged in');

    if (Meteor.users.update(this.userId, {$set: {"profile.website": website}})) {
      recalculateUserScore(this.userId);
      logEvent({type: Events.EV_PROFILE, name: "Changed website", userId: this.userId,
                desc: website});
    }
  },
  'user add contact': function(type, contact) {
    check(type, String);
    check(contact, String);

    if (!this.userId)
      throw new Meteor.Error(401, 'User not logged in');

    if (! _.contains(['phone', 'email', 'skype', 'fax'], type))
      throw new Meteor.Error(403, "Supported contacts: 'phone', 'email', 'skype', 'fax'");

    //var contacts = Meteor.users.findOne(this.userId, {fields: {'profile.contacts': 1}});

    if (Meteor.users.update(this.userId, {$addToSet: {"profile.contacts": {type: type, contact: contact}}})) {
      recalculateUserScore(this.userId);
    }
  },
  'user rm contact': function(type, contact) {
    check(type, String);
    check(contact, String);

    if (!this.userId)
      throw new Meteor.Error(401, 'User not logged in');

    if (Meteor.users.update(this.userId, {$pull: {"profile.contacts": {type: type, contact: contact}}})) {
      recalculateUserScore(this.userId);
    }
  },
  'set user legal status': function(legalStatus) {
    check(legalStatus, String);

    if (!this.userId)
      throw new Meteor.Error(401, 'User not logged in');

    if (Meteor.users.update(this.userId, {$set: {legalStat: legalStatus}})) {
      recalculateUserScore(this.userId);
    }
  },
  'add work place': function(place) {
    check(place, String);

    if (!this.userId)
      throw new Meteor.Error(401, 'User not logged in');

    if (Meteor.users.update(this.userId, {$addToSet: {wrkPlaces: place}})) {
      UserCats.update({u: this.userId}, {$addToSet: {wrkPlaces: place}}, {multi: true});
      recalculateUserScore(this.userId);
    }
  },
  'rm work place': function(place) {
    check(place, String);

    if (!this.userId)
      throw new Meteor.Error(401, 'User not logged in');

    if (Meteor.users.update(this.userId, {$pull: {wrkPlaces: place}})) {
      UserCats.update({u: this.userId}, {$pull: {wrkPlaces: place}}, {multi: true});
      recalculateUserScore(this.userId);
    }
  },
  'add cat': function(catId) {
    check(catId, String);

    if (!this.userId)
      throw new Meteor.Error(401, 'User not logged in');

    var category = Categories.findOne(catId);
    if (!category || !category.p) // родительская категория должна быть
      throw new Meteor.Error(400, 'Category not found');

    // find old defined user cat for this user and category: catId
    var uc = UserCats.findOne({cat: catId, u: this.userId}, {fields: {_id: 1}});
    if (uc)
      UserCats.update(uc._id, {$unset: {rm: ''}}); // снимаем признак удаленного
    else {
      var user = Meteor.users.findOne(this.userId, {fields: {wrkPlaces: 1}});
      UserCats.insert({u: this.userId,
                       cat: catId,
                       pcat: category.p,
                       wrkPlaces: user.wrkPlaces // копируем места где работает юзер
                      });
    }
  },
  'rm cat': function(catId) {

    check(catId, String);

    if (!this.userId)
      throw new Meteor.Error(401, 'User not logged in');

    UserCats.update({cat: catId, u: this.userId}, {$set: {rm: true}});
  },
  'update cat': function(userCatId, minCur, minSum, desc, prices) {
    check(userCatId, String);

    if (!this.userId)
      throw new Meteor.Error(401, 'User not logged in');

    // эта userCat должен существовать, ранее создар с помощью метода 'add cat''
    var currentPrice = UserCats.findOne({_id: userCatId, u: this.userId});
    if (!currentPrice)
      throw new Meteor.Error(401, 'User cat not found ' + userCatId);

    var modifier = {$set: {}};

    // don't update unchanged fields
    if (minSum !== currentPrice.minSum)
      modifier.$set.minSum = minSum;
    if (minCur !== currentPrice.minCur)
      modifier.$set.minCur = minCur;

    if (desc !== currentPrice.desc)
      modifier.$set.desc = desc;

    modifier.$set.prices = prices;

    UserCats.update(userCatId, modifier);
  },
  /*

   Создание юзера админом.

   TODO: нужно ли это, может удолить?
   */
  'admin-create-user': function(phone, fullName, isMaster) {
    check(phone, String);
    check(fullName, String);
    check(isMaster, Boolean);

    if (!isAdmin())
      throw new Meteor.Error(403, 'Только для администраторов');

    fullName = fullName.trim();

    if (fullName.length < 3 || fullName.length > 58 || !phone)
      throw new Meteor.Error(400, "Need to set a fullName or phone");

    if (phone && fullName) {
      var user = Meteor.users.findOne({"phone": phone});
      // create user
      if (!user) {
        var password = Random.id(6); 

        user = {
          profile: { completeName: fullName },
          phone: phone,
          password: SHA256('user'),
          isMaster: isMaster,
        };
        var id = Accounts.insertUserDoc({}, user);

        Accounts.registerHook.map(function(currentFunction) { currentFunction(user, id); });

        logEvent({type: Events.EV_USERLOGIN, name: 'User register by Admin', userId: this.userId,
                  desc: 'Юзер создан админом\n\n' +
                  '* ID:' + id + '\n' +
                  '* мастер: ' + isMaster + '\n'+
                  '* телефон:' + phone});

        return id;
      } else {
        throw new Meteor.Error(403, "Этот номер уже используется.");
      }
    } else
      throw new Meteor.Error (400, 'phone and fullName required for createUserPhone');
  },
  /*

   Сделать админом юзером, тот кто вызывает метод должен быть админом

   */
  'user-admin-grand': function(userId) {
    check(userId, String);

    if (!isAdmin())
      throw new Meteor.Error(403, 'Только для администраторов');
    
    if (Meteor.users.update(userId, {$set: {isAdmin: true}}))
      logEvent({type: Events.EV_SECURITY, name: "Grand admin right", userId: this.userId,
                desc: 'Пользователь стал админом: ' + userId});
  },
  'user-admin-remove': function(userId) {
    check(userId, String);

    if (!isAdmin())
      throw new Meteor.Error(403, 'Только для администраторов');

    // специальный  пользователь  MASTERPHONE  (360123456789)  который
    // создан при запуске, не позволяем убрать ему админа.
    if (Meteor.users.update({_id: userId, phone: {$ne: MASTERPHONE}}, {$set: {isAdmin: false}}))
      logEvent({type: Events.EV_SECURITY, name: "Remove admin right", userId: this.userId,
                desc: 'Админские права убраны у пользователя' + userId});
  },
  // разлогинить
  'user-force-logout': function(userId) {
    check(userId, String);

    if (!isAdmin())
      throw new Meteor.Error(403, 'Только для администраторов');

    if (Meteor.users.update(userId, {$set: {'services.resume.loginTokens': []} }))
      logEvent({type: Events.EV_USERLOGIN, name: "Force logout", userId: this.userId,
                desc: 'Пользователя '+ userId + ' принудительно разлогинили админом'});

  },
  /*
   Misc

   Разные дополнительные методы для юзера
   */
  // шаблоны цен.
  'prices of cat': function(catId) {
    check(catId, String);

    if (!this.userId)
      throw new Meteor.Error(401, 'User not logged in');

    return PriceTmp.find({cat: catId}).fetch();
  }
});

Meteor.startup(function() {

  /*  Создадим админа если его нет с паролем admin */
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

// пакет facts, для фильтрации прав доступа к {{> serverFacts}}
// facts используется в роуте /
Facts.setUserIdFilter(function (userId) {
  return isAdminById(userId);
});
