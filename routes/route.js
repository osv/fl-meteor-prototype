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

Router.map( function () {
  this.route('home', {
    path: '/',
  });
});
