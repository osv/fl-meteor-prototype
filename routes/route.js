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

ApplicationController = RouteController.extend({
  onBeforeAction: function() {
    Paginations.usersPages.unsubscribe();
    return this.next();
  }
});

Paginations = {};               // здесь будут все Meteor.Pagination для доступа с других мест клиента

Meteor.startup(function () {

  Router.route('/', {
    name: 'home',
    controller: 'ApplicationController'
  });

  Router.route('/login', {
    name: 'login',
    controller: 'ApplicationController'
  });

  Router.route('/profile', {
    name: 'myProfile',
    controller: 'ApplicationController'
  });

  Router.route('/profile/personal', {
    name: 'myPersonal',
    controller: 'ApplicationController'
  });

  // all users for admins
  Paginations.usersPages = new Meteor.Pagination(Meteor.users, {
    auth: Meteor.isClient ? function(){} : function(skip, subscription) {
      return isAdminById(subscription.userId);
    },
    perPage: 10,
    templateName: "usersadmin",
    router: "iron-router",
    homeRoute: "/users",
    route: "/users/:group?/",
    routerTemplate: "usersadmin",
    routerLayout: "appLayout",
    itemTemplate: "userInfoForAdmin",
    divWrapper: "",
    pageSizeLimit: 100,
    availableSettings: {
      sort: true,
      perPage: true,
      filters: true,
    },
    sort: {isAdmin: 1, createdAt: 1},
  });

});
