var showSelectedByMeOnly = ReactiveVar();

Template.profileCategories.helpers({
  rootCategories: function() {
    // рут категории те которые не имеют отцов
    return Categories.find({p: {$exists: false}, rm: {$ne: true}}, {sort: {n: 1}});
  },
  showMine: function() { return showSelectedByMeOnly.get() ? 'checked' : ''; }
});

Template.profileCategories.created = function() {
  // установим галочку чтобы показать только мои выбранные если юзер выбрал больше одного
  if (_.isUndefined(showSelectedByMeOnly.get()))
    showSelectedByMeOnly.set(UserCats.find({u: Meteor.userId(), rm: {$ne: true}}).count() > 1);
};

Template.profileCategories.events({
  'change [name="showMine"]': function(e, t) {
    showSelectedByMeOnly.set( e.currentTarget.checked );
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
