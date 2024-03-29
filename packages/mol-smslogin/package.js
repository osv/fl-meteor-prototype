Package.describe({
  summary: "SMS login support for accounts",
  version: "0.0.6"
});

Package.onUse(function(api) {
  api.use('accounts-base', ['client', 'server']);
  // Export Accounts (etc) to packages using this one.
  api.imply('accounts-base', ['client', 'server']);
  api.use('sha', ['client', 'server']);
  api.use('random', ['server']);
  api.use('zeroasterisk:throttle', 'server');
  api.use('iron:router');
  api.use('check');
  api.use(['sacha:spin', 'templating'], 'client');

  // нужен нам {{avatar}}, он в пакете mol-uploads
  api.use('mol-uploads', 'client');

  // api.use('ddp', ['client', 'server']);
  api.addFiles('./server/sms_server.js', 'server');
  api.addFiles('./client/account/accounts.html', 'client');
  api.addFiles('./client/account/sms_client.js', 'client');
  api.addFiles('./client/account/accounts.js', 'client');
});
