Template.profilePub.events({
  'click [data-action="new-portfolio"]': function() {
    Meteor.call('new-portfolio', function(err, profileId) {
      if (err) {
        Messages.info(err.reason);
      } else {
        Router.go('/profile/portfolio/' + profileId);
      }
    });
  },
});

Template.profilePub.helpers({
  portfolio: function() {
    return Meteor.user().gal;
  }
});
