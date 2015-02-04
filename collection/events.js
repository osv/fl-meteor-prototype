var eventSchema = new SimpleSchema({
  createdAt: {
    type: Date
  },
  name: {
    type: String
  },
  description: {
    type: String,
    optional: true
  },
  important: { // true - значит не может быть удалено
    type: Boolean,
    optional: true
  }
});

Events = new Meteor.Collection('events');
Events.attachSchema(eventSchema);

if (Meteor.isServer) {

  Events._ensureIndex('createdAt');
  Events._ensureIndex('name');

  logEvent = function (event) {
    if (!_.has(event, 'name')) {
      throw new Meteor.Error(403, "logEvent without name");
    }
    // if event is supposed to be unique, check if it has already been logged
    if (!!event.unique && !!Events.findOne({name: event.name})) {
      return;
    }

    event.createdAt = new Date();

    Events.insert(event);

  };

  Meteor.startup(function () {
    logEvent({
      name: "First run",
      unique: true, // will only get logged a single time 
      important: true
    });
  });
}
