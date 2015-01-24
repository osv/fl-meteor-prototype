Как пользоватся пакетом smslogin
---------------------------------

* В шаблон добавить `{{ >loginButton }}` это добавит дропдавн бутстрап кнопку.
* Определить функцию `Account.sendSMS` для отправки, например для smsc.ru

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
  

