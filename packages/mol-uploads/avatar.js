function imgId2file(id) {
  return id.toString().replace(/(\w)(\w)/, "$1/$2/$1$2");
}

Template.avatar.helpers({

  size: function () {
    var valid = ['large', 'small', 'extra-small'];
    return _.contains(valid, this.size) ? 'avatar-' + this.size : '';
  },

  dimensions: function () {
    var value;
    if      (this.size === 'large')       value = 80;
    else if (this.size === 'small')       value = 30;
    else if (this.size === 'extra-small') value = 20;
    else                                  value = 200;

    return { width: value, height: value };
  },

  shape: function () {
    var valid = ['rounded', 'circle'];
    return _.contains(valid, this.shape) ? 'avatar-' + this.shape : '';
  },

  class: function () { return this.class; },

  imageUrl: function () {
    var user = this.user ? this.user : Meteor.users.findOne(this.userId);
    if (user.profile.avatar) {
      console.log('avatar: ' + user.profile.avatar);
      if      (this.size === 'large') return '/i/av/thm/' + imgId2file (user.profile.avatar) + '.png';
      else if (this.size === 'small') return '/i/av/soc/' + imgId2file (user.profile.avatar) + '.png';
      else if (this.size === 'extra-small')
        /* */                         return '/i/av/soc/' + imgId2file (user.profile.avatar) + '.png';
      else /* по у молчанию */        return '/i/av/src/' + imgId2file (user.profile.avatar) + '.jpg';
    } else {
      return this.defAv ? this.defAv : false;
    }
  },

  initialsCss: function () {
    var css = '';
    if (this.bgColor)  css += 'background-color: ' + this.bgColor + ';';
    if (this.txtColor) css += 'color: ' + this.txtColor + ';';
    return css;
  },

  initialsText: function () {
    var user = this.user ? this.user : Meteor.users.findOne(this.userId);
    var parts = user.profile.completeName.split(' ');
    // Limit getInitials to first and last initial to avoid problems with
    // very long multi-part names (e.g. "Jose Manuel Garcia Galvez")
    var initials = _.first(parts).charAt(0).toUpperCase();
    if (parts.length > 1) {
      initials += _.last(parts).charAt(0).toUpperCase();
    } else {
      initials += _.first(parts).charAt(1);
    }
    return initials;
  }

});

// Use a reactive variable to store image load success/failure
Template.avatar.created = function () {
//  this.hasImage = new ReactiveVar(true);
};

// Determine if image loaded successfully and set hasImage variable
Template.avatar.rendered = function () {
  var self = this;
  this.$('img')
    .on('error', function () {
      self.$('.avatar').addClass('avatar-hide-image');
    })
    .on('load', function () {
      self.$('.avatar')
        .addClass('avatar-hide-initials')
        .removeClass('avatar-hide-image');
    });
};
