// https://gist.github.com/dariocravero/3922137
// http://stackoverflow.com/questions/13201723/generating-and-serving-static-files-with-meteor


// https://github.com/jtwalters/meteor-cache-busting-url
// https://github.com/awwx/meteor-cache-forever-helper#readme
// https://github.com/awwx/meteor-cache-forever

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

function bigAvatarPath(name) {
  return path.join(UploadDir, 'av/src/', name + '.jpg');
}

function smallAvatarPath(name) {
  return path.join(UploadDir, 'av/thm/', name + '.png');
}

function pendingImgOrig(name) {
  return path.join(UploadDir, 'pending/orig', name + '.png');
}

function pendingImgSmall(name) {
  return path.join(UploadDir, 'pending/thum', name + '.png');
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
        .write(path, cb);
    }),
  cropAndResize: Meteor.wrapAsync(
    function (input, out, coords, size, cb) {
      gm(input)
        .crop(coords.w, coords.h, coords.x, coords.y)
        .resize(size, size)
        .write(out, cb);
    }),
  convert: Meteor.wrapAsync(
    function (buffer, path, cb) {
      gm(buffer)
        .write(path, cb);
    }),
};

Meteor.methods({
  // загрузка аватарки в временной каталог, эта картинка можно обрезать и уже методомо
  // avatar-commit принять изменения.
  // Метод возвращает {id: filename, size: realSize}
  //  id - идентификатор картинки, файл можно получить pendingImgOrig(id)
  //  size - размер этой картинки
  'avatar-upload': function(type, name, blob) {
    if (!type.match(/^image\//)) {
      throw new Meteor.Error(403, "Файл не является изображением");
    }

    console.log(type, name);
    if (!this.userId)
      throw new Meteor.Error(401, 'User not logged in');

    var buffer = new Buffer(blob, 'binary'),
        i = incrementCounter('counters', 'pendingImg'),
        // Имя файла, в подкаталоги распихиваю, '98765' -> '9/8/98765'
        // Это нужно чтобы дохрена файлов не держать в одном каталоге
        filename = i.toString().replace(/(\d)(\d)/, "$1/$2/$1$2"),
        pngfile = pendingImgOrig ( filename ),
        thumbfile = pendingImgSmall ( filename );

    mkdirp.sync(path.dirname(pngfile));
    mkdirp.sync(path.dirname(thumbfile));

    var realSize = imageUtil.getSize(buffer);

    imageUtil.convert( buffer, pngfile );
    imageUtil.resizeAndWrite( buffer, thumbfile, 400, 400);

    return {id: filename, size: realSize};
  },
  // Установить аватарку, @pendingImg - идентификатор который получен был методом 'avatar-upload'
  // @coords - координаты обрезки
  'avatar-commit': function(pendingId, coords) {
    check(pendingId, String);
    check(coords.x, Number);
    check(coords.y, Number);
    check(coords.w, Number);
    check(coords.h, Number);

    if (!this.userId)
      throw new Meteor.Error(401, 'User not logged in');

    var i = incrementCounter('counters', 'avatar'),
        // Имя файла, в подкаталоги распихиваю, '98765' -> '9/8/98765'
        // Это нужно чтобы дохрена файлов не держать в одном каталоге
        avatarId   = i.toString().replace(/(\d)(\d)/, "$1/$2/$1$2"),
        bigname    = bigAvatarPath ( avatarId ),
        thumbname  = smallAvatarPath ( avatarId ),
        pendinfile = pendingImgOrig ( pendingId );

    mkdirp.sync(path.dirname(bigname));
    mkdirp.sync(path.dirname(thumbname));

    imageUtil.cropAndResize(pendinfile, bigname, coords, 400);
    imageUtil.cropAndResize(pendinfile, thumbname, coords, 200);

    var oldAvatar = Meteor.users.findOne(this.userId, {fields: {"profile.avatar": 1}})
          .profile.avatar;

    Meteor.users.update(this.userId, {$set: {"profile.avatar": avatarId}});
    if (oldAvatar) {
      // старую аватарочку удаляем
      try {fs.unlinkSync( bigAvatarPath   ( oldAvatar ) );} catch(e) {}        
      try {fs.unlinkSync( smallAvatarPath ( oldAvatar ) );} catch(e) {}
    }

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
    }
  },
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
