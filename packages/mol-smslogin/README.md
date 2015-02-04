Как пользоватся пакетом smslogin
---------------------------------

* В шаблон добавить `{{ >loginButton }}` это добавит дропдавн бутстрап кнопку.
* Определить функцию `Account.sendSMS` (Server) для отправки, например для smsc.ru

```js
Accounts.sendSMS = function(message, phone) {
  check(phone, String);
  check(message, String);
  if (process.env.SMSC_AUTH) {
    Email.send({
      to: 'send@send.smsc.ru',
      subject: '',
      text: process.env.SMSC_AUTH + ":::1,,,:" + phone +":" + message,
    });
  } else {
    console.warn("please, set SMSC_AUTH=login:password to your smsc.ru ");
    throw new Meteor.Error(503, 'SMS gateway not configured');
  }
};

```
* Добаваление итемов в менюшку дропдавн (будут выше менюшки "Выйти..."):

```js
// можно и масив (Client)
Accounts.addDropMenus({text: 'Ваш профиль', icon: 'glyphicon glyphicon-cog', url: '/profile', id: 'profile'});
// хеш ключи: text, icon, url, id, class
```

## Хуки (Server)

Нмже примеры как использовать

```js
Accounts.registerHook.push(function(user, id) {...})
Accounts.loginHook.push(function(user, ip) {...})
// хук на запрос ресет пароля
Accounts.resetPasswordHook.push(function(user) {...})
// хук после успешного востановления пароля
Accounts.resettedPasswordHook.push(function(user) {...})

```
