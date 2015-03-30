var showSelectedByMeOnly = ReactiveVar(false);

Template.profileCategories.helpers({
  rootCategories: function() {
    // рут категории те которые не имеют отцов
    return Categories.find({p: {$exists: false}, rm: {$ne: true}}, {sort: {n: 1}});
  },
  showMine: function() { return showSelectedByMeOnly.get() ? 'checked' : ''; }
});

Template.profileCategories.events({
  'change [name="showMine"]': function(e, t) {
    var checked = t.find('[name="showMine"]').checked;
    showSelectedByMeOnly.set(checked);
  }
});
Template.profileCatTreeNode.helpers({
  show: function() {
    return (                         
      !this.p ||         // обязательно показываем если это рут раздел
        !(               // или не включен показ только выбранных разделов
          showSelectedByMeOnly.get() &&
            !UserCats.findOne({
              u: Meteor.userId(), cat: this._id, rm: {$ne: true}
            })
        )
    );
  },
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
