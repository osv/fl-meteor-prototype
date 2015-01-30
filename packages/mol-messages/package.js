Package.describe({
  summary: "Message wrapper",
  version: "1.0.0",
});

Package.onUse(function (api, where) {
  api.add_files(['messages.js', 'vendor/jquery.toast.css', 'vendor/jquery.toast.js'], 'client');
  if (api.export)
    api.export('Messages');
});
