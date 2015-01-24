// SMSC_AUTH переменная окружения для логина и пароля с smsc.ru
Accounts.sendSMS = function(message, phone) {
  check(phone, String);
  check(message, String);
  if (process.env.SMSC_AUTH) {
    /*

     sms protocol: http://smsc.ru/api/smtp/#hlr
     <login>:<psw>:<id>:<time>,<tz>:<translit>,<format>,<sender>,<test>:<phones>:<mes>
     ^^^^^^^^^^^^^                                                      ^^^^^^^ ^^^^^
           \_ SMSC_AUTH
     */
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
