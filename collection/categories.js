/*

 Категории/разделы

*/
var categorySchema = new SimpleSchema({
  n: {                          // name of category
    type: String,
    min: 6,
    max: 64,
  },
  rm: {                         // категория удалена, не показывать юзеру
    type: Boolean,
    optional: true
  },
  p: {                         // родительская категория, тоесть это
    type: String,
    optional: true
  },
});

Categories = new Meteor.Collection('categories');
Categories.attachSchema(categorySchema);

Categories.deny({
  update: function(userId, post, fieldNames) {
    return (_.without(fieldNames, 'n', 'rm', 'p').length > 0);
  }
});

Categories.allow({
  insert: isAdminById,
  update: isAdminById,
});

Categories.before.insert(function (userId, cat){
  if (Meteor.isServer) {
    cat._id = '' + incrementCounter('counters', 'category'); // konecty:mongo-counterv
  }
});
