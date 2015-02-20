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
    return '/i/pending/thum/' + id + '.jpg';
});

// portfolio

function imgId2file(id) {
  return id.replace(/(\w)(\w)/, "$1/$2/$1$2");
}

UI.registerHelper('portfolioURLsmall', function(id) {
    return '/i/p/thm/' + imgId2file(id) + '.jpg';
});

UI.registerHelper('portfolioURLbig', function(id) {
    return '/i/p/src/' + imgId2file(id) + '.jpg';
});

UI.registerHelper('portfolioURLorig', function(id) {
    return '/i/p/org/' + imgId2file(id) + '.jpg';
});

UI.registerHelper('portfolioUrlImgPreview', function(id) {
    return '/i/p/pre/' + imgId2file(id) + '.jpg';
});
