Meteor.loginWithPhone = function(phone, password, callback) {
  console.log("Login " + phone + ', ' + password);
  var loginRequest = {phone: phone, pwd: SHA256(password)};

  Accounts.callLoginMethod({
    methodArguments: [loginRequest],
    userCallback: callback
  });
};

Meteor.createUserWithPhone = function(phone, fullName, callback) {
  console.log("Create user " + fullName + ', phone: '+ phone);
  var loginRequest = {phone: phone, fullName: fullName};

  Accounts.callLoginMethod({
    methodArguments: [loginRequest],
    userCallback: callback
  });
};
