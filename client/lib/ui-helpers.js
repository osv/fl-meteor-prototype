/* handlebars helper */

// return 'active' or false if routeName is current route path name
UI.registerHelper('ifActiveRoute', function (routeName) { 
  if (Router.current() &&
      Router.current().location.get().path === routeName)
    return 'active';
  else
    return 'false';
});

// regexp version of ifActiveRoute
UI.registerHelper('ifActiveRouteRE', function (regexp) { 
  if (Router.current() &&
      RegExp(regexp, 'i').test(Router.current().location.get().path))
    return 'active';
  else
    return 'false';
});

UI.registerHelper('isAdmin', function() {
  return isAdmin(Meteor.user());
});

UI.registerHelper('isMaster', function() {
  return isMaster(Meteor.user());
});

UI.registerHelper('isCustomer', function() {
  return isCustomer(Meteor.user());
});

UI.registerHelper('isInitMode', function() {
  return CFG.INIT_MODE;
});
