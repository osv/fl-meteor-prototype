Template.profileCategories.helpers({
  rootCategories: function() {
    // рут категории те которые не имеют отцов
    return Categories.find({p: {$exists: false}});
  }
});

Template.profileCatTreeNode.helpers({

  hasChildren: function() { return Categories.find({p: this._id}).count() > 0; },

  children: function() { return Categories.find({p: this._id}); },

});

Template.profileCatItem.helpers({
  set: function() {
    return _.contains(Meteor.user().cats, this.ctx._id);
  }
});

Template.profileCatItem.events({
  'click [data-action="set"]': function(e, t) {
    var catId = t.data.ctx._id;
    Meteor.users.update(Meteor.userId(), {$addToSet: {cats: catId}});
  },
  'click [data-action="unset"]': function(e, t) {
    var catId = t.data.ctx._id;
    if (confirm('Удалить услугу "' + t.data.ctx.n + '"?'))
      Meteor.users.update(Meteor.userId(), {$pull: {cats: catId}});
  },
});
