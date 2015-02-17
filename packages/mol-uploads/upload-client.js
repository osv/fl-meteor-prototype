UI.registerHelper('avatarUrlSmall', function(avatar) {
  if (!avatar)
    avatar = Meteor.user().profile.avatar;
  if (avatar)
    return '/i/av/thm/' + avatar + '.png';
  else
    return '/default.jpg';
});

UI.registerHelper('avatarUrlBig', function(avatar) {
  if (!avatar)
    avatar = Meteor.user().profile.avatar;
  if (avatar)
    return '/i/av/src/' + avatar + '.jpg';
  else
    return '/default.jpg';
});

UI.registerHelper('avatarUrlMicro', function(avatarId) {
  return '/i/av/soc/' + avatarId + '.png';
});

UI.registerHelper('avatarForCrop', function(id) {
    return '/i/pending/thum/' + id + '.png';
});
