Template.profileCategories.helpers({
  rootCategories: function() {
    // рут категории те которые не имеют отцов
    return Categories.find({p: {$exists: false}, rm: {$ne: true}}, {sort: {n: 1}});
  },
});

Template.profileCatTreeNode.helpers({
  children: function() { return Categories.find({p: this._id, rm: {$ne: true}}, {sort: {n: 1}}); },
});

Template.profileCatItem.created = function(){
  this.load = new ReactiveVar();
};

Template.profileCatItem.helpers({
  set: function() {
    return UserCats.findOne({u: Meteor.userId(), cat: this.ctx._id, rm: {$ne: true}});
  },
  isLoad: function() { return Template.instance().load.get(); }
});

Template.profileCatItem.events({
  'click [data-action="set"]': function(e, t) {
    var catId = t.data.ctx._id;
    t.load.set(true);
    Meteor.call('add cat', catId, function(err) {
      t.load.set(false);
      if (err)
        Messages.info(err.reason);
    });
  },
  'click [data-action="unset"]': function(e, t) {
    var catId = t.data.ctx._id;
    if (confirm('Удалить услугу "' + t.data.ctx.n + '"?')) {
      t.load.set(true);
      Meteor.call('rm cat', catId, function(err) {
        t.load.set(false);
        if (err)
          Messages.info(err.reason);
      });
    }
  },
});
