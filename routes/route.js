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

// Custom options
Router.plugin('auth', {
  authenticate: {
    route: 'login'
  },
  except: ['home', 'login'],
});

Meteor.startup(function () {

  Router.route('/', {
    name: 'home',
  });

  Router.route('/login', {
    name: 'login',
  });

  Router.route('/profile', {
    name: 'myProfile',
  });

  Router.route('/profile/personal', {
    name: 'myPersonal',
  });

});
