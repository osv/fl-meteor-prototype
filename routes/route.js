Router.configure({
  layoutTemplate: 'appLayout',
  notFoundTemplate: '404',
  // notFoundTemplate: 'notFound',
  yieldTemplates: {
    'appMenu': {to: 'header'},
    'appFooter': {to: 'footer'}
  },
  progressSpinner : false,      // смотри multiply:iron-router-progress
});

Meteor.startup(function () {

  Router.route('/', {
    name: 'home',
  });

  Router.route('/profile', {
    name: 'profile',
    template: 'myProfile',
  });

});
