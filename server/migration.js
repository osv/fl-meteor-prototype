Migrations.add({
  version: 2,
  name: 'Move users.profile.dLong to users.dLong',
  up: function() {
    Meteor.users.find().forEach(function(user) {
      if (_.has(user.profile, "dLong")) {
        Meteor.users.update(user._id, {$set: {dLong: user.profile.dLong}});
      }
    });
  }
});

Migrations.add({
  version: 1,
  name: 'Add user score',
  up: function() {
    Meteor.users.find().forEach(function(user) {
      recalculateUserScore(user);
    });
  }
});

Meteor.startup(function(){
  Migrations.migrateTo('latest');
});
