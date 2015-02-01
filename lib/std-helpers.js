/* Здесь будут вспомагательные функции */

// copypasted from Telescope
isAdmin=function(user){
  user = (typeof user === 'undefined') ? Meteor.user() : user;
  return !!user && !!user.isAdmin;
};

