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
