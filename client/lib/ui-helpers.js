/* handlebars helper */

// return 'active' or false if routeName is current route path name
UI.registerHelper('ifActiveRoute', function (routeName) { 
  if (Router.current().location.get().path === routeName)
    return 'active';
  else
    return 'false';
});

UI.registerHelper('isAdmin', function() {
  return isAdmin(Meteor.user());
});
