var eventSchema = new SimpleSchema({
  _id: {
    type: String,
  },
  createdAt: {
    type: Date
  },
  name: {
    type: String
  },
  type: {
    type: Number
  },
  desc: {
    type: String,
    optional: true
  },
  userId: {                      // к кому относиться этот ивент
    type: String,
    optional: true,
  },
  important: { // true - значит не может быть удалено
    type: Boolean,
    optional: true
  }
});

Events = new Meteor.Collection('events');
Events.attachSchema(eventSchema);

// типы событий

Events.EV_BOOT = 1;
Events.EV_USERLOGIN = 2;

if (Meteor.isServer) {

  Events._ensureIndex('createdAt');
  Events._ensureIndex('name');
  Events._ensureIndex('type');

  logEvent = function (event) {
    if (!_.has(event, 'name')) {
      throw new Meteor.Error(403, "logEvent without name");
    }
    // if event is supposed to be unique, check if it has already been logged
    if (!!event.unique && !!Events.findOne({name: event.name})) {
      return;
    }
    event.type |= 0;
    event.createdAt = new Date();
    event._id = incrementCounter('counters', 'event'), // konecty:mongo-counterv
    Events.insert(event);

  };

  Meteor.startup(function () {
    logEvent({
      type: Events.EV_BOOT,
      name: "First run",
      unique: true, // will only get logged a single time 
      important: true
    });

    logEvent({
      type: Events.EV_BOOT,
      name: "Start meteor",
    });

  });
}
