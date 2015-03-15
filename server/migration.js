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
