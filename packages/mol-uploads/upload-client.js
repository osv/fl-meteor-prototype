UI.registerHelper('avatarUrlSmall', function() {
  var avatar = Meteor.user().profile.avatar;
  if (avatar)
    return '/i/av/thm/' + avatar + '.png';
  else
    return '/default.jpg';
});

UI.registerHelper('avatarUrlBig', function() {
  var avatar = Meteor.user().profile.avatar;
  if (avatar)
    return '/i/av/src/' + avatar + '.png';
  else
    return '/default.jpg';
});

UI.registerHelper('avatarForCrop', function(id) {
    return '/i/pending/thum/' + id + '.png';
});
