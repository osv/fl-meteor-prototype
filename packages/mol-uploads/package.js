Package.describe({
  name: "mol-uploads",
  summary: 'Upload manager',
  version: '0.0.3',
});

Npm.depends({
  'mkdirp' : '0.5.0',
  'gm' : '1.14.2'
});

Package.onUse(function(api) {
  api.versionsFrom('0.9.0');
  api.use(['iron:router', 'zeroasterisk:throttle'], 'server');
  api.use(['ui',                // убрать если не будет хелперов
           'templating',
           'stylus'], 'client');

  // for jcrop
  api.use('jquery', 'client');

  api.add_files([
    'vendor/Jcrop/js/jquery.Jcrop.js',
    'vendor/Jcrop/css/jquery.Jcrop.css',
    'vendor/Jcrop/css/Jcrop.gif'
  ], 'client');

  api.addFiles('upload-server.js', 'server');
  api.addFiles('upload-client.js', 'client');

  api.addFiles([
    'avatar.html',
    'avatar.js',
    'avatar.styl'
    ], 'client');

});

