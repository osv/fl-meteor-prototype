Schema = {};

Schema.UserProfile = new SimpleSchema({
  completeName: {
    type: String,
    optional: true
  },
  phone: {
    type: String,
    regEx: /^\d{11,12}$/
  },
});

Schema.User = new SimpleSchema({
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
  // Add `roles` to your schema if you use the meteor-roles package.
  // Note that when using this package, you must also specify the
  // `Roles.GLOBAL_GROUP` group whenever you add a user to a role.
  // Roles.addUsersToRoles(userId, ["admin"], Roles.GLOBAL_GROUP);
  // You can't mix and match adding with and without a group since
  // you will fail validation in some cases.
  roles: {
    type: Object,
    optional: true,
    blackbox: true
  }
});

Meteor.users.attachSchema(Schema.User);
