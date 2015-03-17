Router.configure({
  layoutTemplate: 'appLayout',
  notFoundTemplate: '404',
  yieldTemplates: {
    'appMenu': {to: 'header'},
    'appFooter': {to: 'footer'}
  },
  progressSpinner : false,      // смотри multiply:iron-router-progress
  waitOn: function() {
    return [Meteor.subscribe("currentUser"),   // подписка на текучего юзера
            Meteor.subscribe("cats"),          // категории
           ];
  },
  loadingTemplate: 'loading'
});

// Custom options
Router.plugin('auth', {
  authenticate: {
    route: 'login'
  },
  except: ['home', 'login'],
});

// базовый контроллер
ApplicationController = RouteController.extend({
  onBeforeAction: function() {
    Paginations.usersPages.unsubscribe();
    Paginations.eventsPages.unsubscribe();
    return this.next();
  }
});

// контроллер для личного кабинета
CabinetController = ApplicationController.extend({
  layoutTemplate: 'appCabinet',
  yieldTemplates: {
    'appMenu': {to: 'header'},
    'appNavigation': {to: 'navigation'},
    'appFooter': {to: 'footer'}
  },
});

Paginations = {};               // здесь будут все Meteor.Pagination для доступа с других мест клиента

Meteor.startup(function () {

  Router.route('/', {
    name: 'home',
    layoutTemplate: 'homeLayout',
    controller: 'ApplicationController'
  });

  Router.route('/login', {
    name: 'login',
    controller: 'ApplicationController'
  });

  Router.route('/profile', {
    name: 'profilePub',
    controller: 'CabinetController'
  });

  Router.route('/profile/personal', {
    name: 'profilePersonal',
    controller: 'CabinetController'
  });

  Router.route('/profile/portfolio/:id', {
    name: 'profilePortfolio',
    controller: 'CabinetController',
    waitOn: function () {
      return Meteor.subscribe('editMyPortfolio', this.params.id); 
    },
    data: function () {
      return Portfolio.findOne(this.params.id);
    }
  });

  Router.route('/admin_info', {
    name: 'AdminInfo',
    controller: 'ApplicationController'
  });

  // редактирование категорий
  Router.route('/adminCat', {
    name: 'adminCategories',
    controller: 'ApplicationController',
  });

  // all users for admins
  Paginations.usersPages = new Meteor.Pagination(Meteor.users, {
    auth: Meteor.isClient ? function(){} : function(skip, subscription) {
      return isAdminById(subscription.userId);
    },
    perPage: 10,
    templateName: "usersAdmin",
    router: "iron-router",
    homeRoute: "/users",
    route: "/users/",
    routerTemplate: "usersAdmin",
    routerLayout: "appLayout",
    itemTemplate: "userInfoForAdmin",
    divWrapper: "",
    resetOnReload: true,
    pageSizeLimit: 100,
    availableSettings: {
      sort: true,
      perPage: true,
      filters: true,
    },
    sort: {createdAt: -1},
  });

  // events viewer for admins
  Paginations.eventsPages = new Meteor.Pagination(Events, {
    auth: Meteor.isClient ? function(){} : function(skip, subscription) {
      return isAdminById(subscription.userId);
    },
    perPage: 50,
    templateName: "events",
    router: "iron-router",
    homeRoute: "/events",
    route: "/events/",
    routerTemplate: "events",
    routerLayout: "appLayout",
    itemTemplate: "eventItem",
    divWrapper: "",
    resetOnReload: true,
    pageSizeLimit: 500,
    availableSettings: {
      sort: true,
      perPage: true,
      filters: true,
    },
    sort: {createdAt: -1},
  });

});
