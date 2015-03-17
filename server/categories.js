Meteor.publish('cats', function() {
  var options = {};

  // если админ то показываем и удаленные категории
  if (! isAdminById(this.userId))
    options = {rm: {$ne: true }};

  return Categories.find(options);
});
