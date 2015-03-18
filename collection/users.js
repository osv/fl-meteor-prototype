Schema = {};

// схема дополнительных контактов
Schema.Contacts = new SimpleSchema({
  type: {
    type: String,
    allowedValues: ['phone', 'email', 'skype', 'fax']
  },
  contact: {
    type: String
  }
});

// денормализировання часть портфолио, только превьюшка тайтл
Schema.Portfolio = new SimpleSchema({
  id: {                         // айди
    type: String,
  },
  preview: {                       // картинка предпросмотра
    type: String,
  },
  title: {                      // тайстл
    type: String,
    optional: true   
  }
});

Schema.UserProfile = new SimpleSchema({
  completeName: {
    type: String,
    optional: true,
    min: 2,
    max: 58,
  },
  dShort: {                     // описан работ мастера краткое
    type: String,
    optional: true,
    max: 214,
  },
  dLong: {                      // описан работ мастера ПОДРОБНОЕ
    type: String,
    optional: true
  },
  website: {
    type: String,
    optional: true,
    max: 64,                    // не позволим длинные ссылки
  },
  contacts: {
    type: [Schema.Contacts],
    optional: true
  },
  avatar: {
    type: String,
    optional: true
  }
});

Schema.User = new SimpleSchema({
  phone: {
    type: String,
    regEx: /^\d{11,12}$/
  },
  password: {
    type: String,
    regEx: /\w{6,}/     // минимум 6 символов пароль
  },
  emails: {
    type: [Object],
    optional: true
  },
  "emails.$.address": {
    type: String,
    regEx: SimpleSchema.RegEx.Email
  },
  "emails.$.verified": {
    type: Boolean
  },
  createdAt: {
    type: Date
  },
  profile: {
    type: Schema.UserProfile,
    optional: true
  },
  gal: {                        // портфолио
    type: [Schema.Portfolio],
    optional: true
  },
  legalStat: {                  // ИП, частно лицо, и тд. Смотри id в LegalStatuses файла config.js
    type: String,
    allowedValues: _.pluckChildrenId(LegalStatuses),
    optional: true
  },
  legalName: {                  // имя индивидуального предпринимателя, компании.
    type: String,
    optional: true
  },
  wrkPlaces: {                     // места в которых работает мастер
    type: [String],                // значение - id городов, стран, регионов
    optional: true
  },
  // Очки по которому будет продвижение  в каталоге мастеров. Пока что
  // оно символизирует  на сколько профиль заполнен.  Для "про" просто
  // добавим  какоето большое  число и  таким образом  они будут  выше
  // обычных юзеров.
  score: {          
    type: Number,
    optional: true
  },
  cats: {                       // id категории, услуги которые оказывает мастер
    type: [String],
    optional: true,
  },
  services: {                   // служебное поле, используется внутри метеора
    type: Object,
    optional: true,
    blackbox: true
  },
  isAdmin: {
    type: Boolean,
    optional: true,
  },
  isMaster: {
    type: Boolean,
    optional: true,
  }
});

Meteor.users.attachSchema(Schema.User);

Meteor.users.deny({
  update: function(userId, post, fieldNames) {
    return (_.without(fieldNames, 'cats').length > 0);
  }
});

Meteor.users.allow({
  update: function(userId, doc){
    return userId == doc._id;
  },
});

/*
 Role base permisssion
 */

can = {};

can.edit = function(user, item) {
  user = (typeof user === 'undefined') ? Meteor.user() : user;
  // если юзер админ или овнер item
  if (!user || !item || (user._id !== item.userId && !user.isAdmin)) {
    return false;
  } else {
    return true;
  }
};

can.editById = function(userId, item) {
  var user = Meteor.users.findOne(userId);
  return can.edit(user, item);
};
