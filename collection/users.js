Schema = {};

Schema.UserProfile = new SimpleSchema({
  completeName: {
    type: String,
    optional: true
  },
  dShort: {                     // описан работ мастера краткое
    type: String,
    optional: true
  },
  dLong: {                      // описан работ мастера ПОДРОБНОЕ
    type: String,
    optional: true
  },
  website: {
    type: String,
    optional: true
  },
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
  services: {
    type: Object,
    optional: true,
    blackbox: true
  },
  isAdmin: {
    type: String,
    optional: true,
  },
  isMaster: {
    type: String,
    optional: true,
  }
});

Meteor.users.attachSchema(Schema.User);

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
