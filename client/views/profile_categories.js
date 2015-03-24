Template.profileCategories.helpers({
  rootCategories: function() {
    // рут категории те которые не имеют отцов
    return Categories.find({p: {$exists: false}, rm: {$ne: true}}, {sort: {n: 1}});
  }
});

Template.profileCatTreeNode.helpers({
  children: function() { return Categories.find({p: this._id, rm: {$ne: true}}, {sort: {n: 1}}); },
});

Template.profileCatItem.helpers({
  set: function() {
    return _.contains(Meteor.user().cats, this.ctx._id);
  },
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
