// https://gist.github.com/dariocravero/3922137
// http://stackoverflow.com/questions/13201723/generating-and-serving-static-files-with-meteor
// http://habrahabr.ru/post/242943/ - там пример gm.js

// https://github.com/jtwalters/meteor-cache-busting-url
// https://github.com/awwx/meteor-cache-forever-helper#readme
// https://github.com/awwx/meteor-cache-forever


/*

 Каталоги картинок:

 Avatars:
 /i/av/src/X/Y/XY.jpg
 /i/av/thm/X/Y/XY.png
 /i/av/soc/X/Y/XY.png

 Ожидаются к обрезки на аватар, их потом нужно удалить
 /i/pending/orig/X/Y/XY.jpg
 /i/pending/thum/X/Y/XY.jpg

 Портфолио
 /i/p/src/X/Y/XY.jpg
 /i/p/thm/X/Y/XY.jpg
 /i/p/org/X/Y/XY.jpg

 Превью для портфолио
 /i/p/pre/X/Y/XY.jpg
 
*/

var fs = Npm.require('fs'),
    path = Npm.require('path'),
    mkdirp = Npm.require('mkdirp'),
    gm = Npm.require('gm');

gm = gm.subClass({ imageMagick: true });

// upload location
UploadDir = "";
if (process.env.UPLOADDIR)
  UploadDir = process.env.UPLOADDIR;

if (!UploadDir && __meteor_bootstrap__ && __meteor_bootstrap__.serverDir) {
  UploadDir = path.join(__meteor_bootstrap__.serverDir, '../../../uploads');
}

if (!UploadDir)
  throw new Error('Unable to determine uploaddir path, set env UPLOADDIR');

// Set absolute path
var UploadDir = path.resolve(UploadDir);
// Ensure the path exists
mkdirp.sync(UploadDir);

console.log("==> Uploads located: %s", UploadDir);

// limit uploads per user, log event
function limitUploads(userId) {
  // ограничем количество аплоада для юзера в 300 в день, на всякий случай
  if (!Throttle.checkThenSet('upload.' + userId, 300, 86400000)) {
    logEvent({type: Events.EV_SECURITY, userId: userId, name: "Upload overhead"});
    throw new Meteor.Error(403, 'Слишком много загрузок');
  }
}

// "foobar" -> "f/o/foobar"
function id2filename(id) {
  return id.toString().replace(/(\w)(\w)/, "$1/$2/$1$2");
}

function bigAvatarPath(id) {
  return path.join(UploadDir, 'av/src/', id2filename(id) + '.jpg');
}

function smallAvatarPath(id) {
  return path.join(UploadDir, 'av/thm/', id2filename(id) + '.png');
}

function microAvatarPath(id) {
  return path.join(UploadDir, 'av/soc/', id2filename(id) + '.png');
}

function pendingImgOrig(id) {
  return path.join(UploadDir, 'pending/orig', id2filename(id) + '.png');
}

function pendingImgSmall(id) {
  return path.join(UploadDir, 'pending/thum', id2filename(id) + '.jpg');
}

// Async imagemagick utils
var imageUtil = {
  getSize: Meteor.wrapAsync(
    function(buffer, cb) {
      gm(buffer)
        .size(cb);
    }),
  resizeAndWrite: Meteor.wrapAsync(
    function (buffer, path, w, h, cb) {
      gm(buffer)
        .resize(w, h)
        .noProfile()            // noProfile() - Removes EXIF, ICM, etc profile data.
        .write(path, cb);
    }),
  cropAndResize: Meteor.wrapAsync(
    function (input, out, coords, w, h, cb) {
      gm(input)
        .crop(coords.w, coords.h, coords.x, coords.y)
        .resize(w, h)
        .noProfile()
        .write(out, cb);
    }),
  resizeCropCenter: Meteor.wrapAsync(
    function (input, out, w, h, cb) {
      gm(input)
        .resize(w, "" + h + "^", ">")
        .gravity('Center')
        .crop(w, h, 0, 0)
        .noProfile()
        .write(out, cb);
    }),
  convert: Meteor.wrapAsync(
    function (buffer, path, cb) {
      gm(buffer)
        .noProfile()
        .write(path, cb);
    }),
};

Meteor.methods({
  // загрузка аватарки в временной каталог, эта картинка можно обрезать и уже методомо
  // avatar-commit принять изменения.
  // Метод возвращает {id: imgId, size: realSize}
  //  id - идентификатор картинки, файл можно получить pendingImgOrig(id)
  //  size - размер этой картинки
  'avatar-upload': function(type, name, blob) {
    if (!type.match(/^image\//)) {
      throw new Meteor.Error(403, "Файл не является изображением");
    }

    console.log(type, name);
    if (!this.userId)
      throw new Meteor.Error(401, 'User not logged in');

    limitUploads(this.userId);

    var buffer = new Buffer(blob, 'binary'),
        imgId = incrementCounter('counters', 'pendingImg'),
        // Имя файла, в подкаталоги распихиваю, '98765' -> '9/8/98765'
        // Это нужно чтобы дохрена файлов не держать в одном каталоге
        pngfile = pendingImgOrig ( imgId ),
        thumbfile = pendingImgSmall ( imgId );


    mkdirp.sync(path.dirname(pngfile));
    mkdirp.sync(path.dirname(thumbfile));

    var realSize = imageUtil.getSize(buffer);

    imageUtil.convert( buffer, pngfile );
    imageUtil.resizeAndWrite( buffer, thumbfile, 400, 400);

    logEvent({type: Events.EV_PROFILE, userId: this.userId, name: "Avatar uploaded"});
    console.log(imgId);
    return {id: imgId, size: realSize};
  },
  // Установить аватарку, @pendingImg - идентификатор который получен был методом 'avatar-upload'
  // @coords - координаты обрезки
  'avatar-commit': function(pendingId, coords) {
    check(pendingId, Match.Any);
    check(coords.x, Number);
    check(coords.y, Number);
    check(coords.w, Number);

    _.each(['w', 'x', 'y'], function(it) {
      coords[it] = Math.floor(coords[it]); });

    coords.h = coords.w;

    if (coords.w < 10)
      throw new Meteor.Error(403, 'Выделите фрагмент фотографии');

    if (!this.userId)
      throw new Meteor.Error(401, 'User not logged in');

    var avatarId = incrementCounter('counters', 'avatar'),
        // Имя файла, в подкаталоги распихиваю, '98765' -> '9/8/98765'
        // Это нужно чтобы дохрена файлов не держать в одном каталоге
        bigname    = bigAvatarPath   ( avatarId ),
        thumbname  = smallAvatarPath ( avatarId ),
        microname  = microAvatarPath ( avatarId ),
        pendinfile = pendingImgOrig ( pendingId );

    mkdirp.sync(path.dirname(bigname));
    mkdirp.sync(path.dirname(thumbname));
    mkdirp.sync(path.dirname(microname));

    imageUtil.cropAndResize(pendinfile, bigname, coords, 200, 200);
    imageUtil.cropAndResize(pendinfile, thumbname, coords, 80, 80);
    imageUtil.cropAndResize(pendinfile, microname, coords, 30, 30);

    var oldAvatar = Meteor.users.findOne(this.userId, {fields: {"profile.avatar": 1}})
          .profile.avatar;

    Meteor.users.update(this.userId, {$set: {"profile.avatar": avatarId}});

    if (oldAvatar) {
      // старую аватарочку удаляем
      try {fs.unlinkSync( bigAvatarPath   ( oldAvatar ) );} catch(e) {}        
      try {fs.unlinkSync( smallAvatarPath ( oldAvatar ) );} catch(e) {}
      try {fs.unlinkSync( microAvatarPath ( oldAvatar ) );} catch(e) {}
    }
    try {fs.unlinkSync( pendinfile );} catch(e) {}
    logEvent({type: Events.EV_PROFILE, userId: this.userId, name: "Avatar saved",
              desc: "![avatar](" + Meteor.absoluteUrl() + 'i/av/soc/' + id2filename(avatarId) + '.png)'});
    return avatarId;
  },
  // удаляет аватарку
  'avatar-remove': function() {

    if (!this.userId)
      throw new Meteor.Error(401, 'User not logged in');

    var oldAvatar = Meteor.users.findOne(this.userId, {fields: {"profile.avatar": 1}})
          .profile.avatar;

    Meteor.users.update(this.userId, {$unset: {"profile.avatar": ""}});

    if (oldAvatar) {
      // TODO: Возможно следует сохранить гдето удаленную?
      try {fs.unlinkSync( bigAvatarPath   ( oldAvatar ) );} catch(e) {}        
      try {fs.unlinkSync( smallAvatarPath ( oldAvatar ) );} catch(e) {}
      try {fs.unlinkSync( microAvatarPath ( oldAvatar ) );} catch(e) {}
    }
    logEvent({type: Events.EV_PROFILE, userId: this.userId, name: "Avatar removed"});
  }
});

function smallPortfolioPath(id) {
  return path.join(UploadDir, 'p/thm/', id2filename(id) + '.jpg');
}

function bigPortfolioPath(id) {
  return path.join(UploadDir, 'p/src/', id2filename(id) + '.jpg');
}

function origPortfolioPath(id) {
  return path.join(UploadDir, 'p/org/', id2filename(id) + '.jpg');
}

function previewPortfolioPath(id) {
  return path.join(UploadDir, 'p/pre/', id2filename(id) + '.jpg');
}

function pendingOrigPortfolioPath(id) {
  return path.join(UploadDir, 'p/pending/src/', id2filename(id) + '.jpg');
}

function pendingSmallPortfolioPath(id) {
  return path.join(UploadDir, 'p/pending/thm/', id2filename(id) + '.jpg');
}

/*      
 
 Ниже методы для аплоада фото портфолио

 */

function updateUserPortfolioPrev(userId, portfolioId, previewId) {
  // Смотри схему юзера,
  // Обновляем превю
  Meteor.users.update({_id: userId, "gal.id": portfolioId},
                        {$set: {"gal.$.preview": previewId}});
}


Meteor.methods({
  // upload photo
  'portfolio-upload': function(portfolioId, type, name, blob) {
    console.log('upload '+name);
    if (!type.match(/^image\//)) {
      throw new Meteor.Error(403, "Файл не является изображением");
    }

    if (!this.userId)
      throw new Meteor.Error(401, 'User not logged in');

    limitUploads(this.userId);

    // смотрим есть ли такое вообще портфолио, на всякий случай
    if (!Portfolio.findOne({_id: portfolioId, userId: this.userId}))
      throw new Meteor.Error(400, 'There no such portfolio');

    var buffer = new Buffer(blob, 'binary'),
        imgId = incrementCounter('counters', 'portfolio'),
        // Имя файла, в подкаталоги распихиваю, '98765' -> '9/8/98765'
        // Это нужно чтобы дохрена файлов не держать в одном каталоге
        origfile = origPortfolioPath ( imgId ),
        thumbfile = smallPortfolioPath ( imgId ),
        bigfile = bigPortfolioPath ( imgId );

    mkdirp.sync(path.dirname(origfile));
    mkdirp.sync(path.dirname(thumbfile));
    mkdirp.sync(path.dirname(bigfile));

    try {
      imageUtil.convert( buffer, origfile );
      imageUtil.resizeCropCenter(origfile, thumbfile, 300, 200);
      imageUtil.resizeCropCenter(origfile, bigfile, 800, 600);
    } catch (e) {
      try {fs.unlinkSync( origfile); } catch(er) {}
      try {fs.unlinkSync( thumbfile); } catch(er) {}
      try {fs.unlinkSync( bigfile); } catch(er) {}
      throw new Meteor.Error(500, 'Ошибка загрузки файла ' + name);
    }
    Portfolio.update(portfolioId, {$addToSet: {img: {i: imgId}}});

    // Делаем превьюшку если нет превю.
    var p = Portfolio.findOne(portfolioId, {fields: {preview: 1}});
    if (!p.preview) {
      var prevId = incrementCounter('counters', 'portfolioThumb'),
          previewfile = previewPortfolioPath(prevId);
      mkdirp.sync(path.dirname(previewfile));

      imageUtil.resizeCropCenter(origfile, previewfile, 200, 150);

      if (Portfolio.update(portfolioId, {$set: {preview: prevId}}))
        updateUserPortfolioPrev(this.userId, portfolioId, prevId);
    }
  },
  'portfolio-rm-image': function(portfolioId, imageId) {
    check(portfolioId, String);
    check(imageId, String);

    if (!this.userId)
      throw new Meteor.Error(401, 'User not logged in');

    var portfolio = Portfolio.findOne({_id: portfolioId, userId: this.userId});
    if (!portfolio)
      throw new Meteor.Error(400, 'There no such portfolio');

    Portfolio.update({_id: portfolioId, userId: this.userId}, {$pull: {img: {i: imageId}}});

    try {fs.unlinkSync( smallPortfolioPath( imageId )); } catch(e) {}
    try {fs.unlinkSync( bigPortfolioPath( imageId )); } catch(e) {}
    try {fs.unlinkSync( origPortfolioPath( imageId )); } catch(e) {}
  },
  'portfolio-rm-uploads': function(portfolioId) {
    check(portfolioId, String);

    if (!this.userId)
      throw new Meteor.Error(401, 'User not logged in');

    var portfolio = Portfolio.findOne({_id: portfolioId, userId: this.userId});
    if (!portfolio)
      throw new Meteor.Error(400, 'There no such portfolio');

    // удаляем файлы картинок
    _.each(portfolio.img, function(img) {
      console.log('remove %s', img.i);
      try {fs.unlinkSync( smallPortfolioPath( img.i )); } catch(e) {}
      try {fs.unlinkSync( bigPortfolioPath( img.i )); } catch(e) {}
      try {fs.unlinkSync( origPortfolioPath( img.i )); } catch(e) {}
    });

    // удаляем файл превю портфолио
    if (portfolio.preview) {
      console.log('remove preview %s');
      try {fs.unlinkSync( previewPortfolioPath( portfolio.preview )); } catch(e) {}
    }
  },
  // Метод возвращает {id: filename, size: realSize}
  //  id - идентификатор картинки
  //  size - размер этой картинки
  'portfolio-upload-preview': function(portfolioId, type, name, blob) {
    if (!type.match(/^image\//)) {
      throw new Meteor.Error(403, "Файл не является изображением");
    }

    if (!this.userId)
      throw new Meteor.Error(401, 'User not logged in');

    limitUploads(this.userId);

    // смотрим есть ли такое вообще портфолио, на всякий случай
    if (!Portfolio.findOne({_id: portfolioId, userId: this.userId}))
      throw new Meteor.Error(400, 'There no such portfolio');

    var buffer = new Buffer(blob, 'binary'),
        pendingId = incrementCounter('counters', 'previewPending'),
        pendingfile = pendingOrigPortfolioPath (pendingId),
        thumbfile = pendingSmallPortfolioPath (pendingId);

    mkdirp.sync(path.dirname(pendingfile));
    mkdirp.sync(path.dirname(thumbfile));

    var realSize = imageUtil.getSize(buffer);

    imageUtil.convert( buffer, pendingfile );
    imageUtil.resizeAndWrite( buffer, thumbfile, 400, 400);

    return {id: pendingId, size: realSize};
  },
  'portfolio-commit-preview': function(portfolioId, pendingId, coords) {
    check(pendingId, Match.Any);
    check(coords.x, Number);
    check(coords.y, Number);
    check(coords.w, Number);

    _.each(['w', 'x', 'y'], function(it) {
      coords[it] = Math.floor(coords[it]); });

     coords.h = coords.w / 1.333 ;

    if (coords.w < 10)
      throw new Meteor.Error(403, 'Выделите фрагмент фотографии');

    if (!this.userId)
      throw new Meteor.Error(401, 'User not logged in');

    var portfolio = Portfolio.findOne({_id: portfolioId, userId: this.userId}, {fields: {preview: 1}});
    if (!portfolio)
      throw new Meteor.Error(400, 'There no such portfolio');

    var prevId = incrementCounter('counters', 'portfolioThumb'),
        previewfile = previewPortfolioPath( prevId ),
        pendingfile = pendingOrigPortfolioPath (pendingId);

    mkdirp.sync(path.dirname(previewfile));

    imageUtil.cropAndResize(pendingfile, previewfile, coords, 200, 150);

    // удаляем старую превюшку
    if (portfolio.preview) {
      try {fs.unlinkSync( previewPortfolioPath( portfolio.preview )); } catch(e) {}
    }

    if (Portfolio.update(portfolioId, {$set: {preview: prevId}}))
      updateUserPortfolioPrev(this.userId, portfolioId, prevId);

    try {fs.unlinkSync( bigAvatarPath   ( pendingfile ) );} catch(e) {}
  }
});


// роут /i/* отдаем статику, но без кеш контрола пока что
Router.map(function() {
  this.route('serveUploads', {
    where: 'server',
    path: /^\/i\/(.*)$/,
    action: function() {
      var filePath = path.join(UploadDir, this.params[0]);

      try {
        var data = Meteor.wrapAsync(fs.readFile)(filePath);
      } catch(e) {
        this.response.writeHead(404, {
          'Content-Type': 'text/html',
        });
        this.response.end();
        return;
      }
      this.response.writeHead(200, {
        'Content-Type': 'image',
      });
      this.response.write(data);
      this.response.end();
    }
  });
});
