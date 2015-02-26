// "foobar" -> "f/o/foobar"
function imgId2file(id) {
  return id.toString().replace(/(\w)(\w)/, "$1/$2/$1$2");
}

UI.registerHelper('avatarForCrop', function(imgId) {
  console.log('avatarForCrop', imgId);
    return '/i/pending/thum/' + imgId2file (imgId) + '.jpg';
});

// portfolio

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

UI.registerHelper('portfolioForCrop', function(id) {  
    return '/i/p/pending/thm/' + imgId2file(id) + '.jpg';
});
