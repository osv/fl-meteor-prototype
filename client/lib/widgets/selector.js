/*

 Виджет который рисует селект2 и кнопки сохранить, отменить.

 Пример:

 html:
 {{wSelector context=selectContext
             placeholder="Select some items}}
 
 js:

 Template.sometemplate.helpers({
  context: function() {
    return {
      data: [{id: 'foo1', text: "Txt 2"}, {id: 'foo2', text: "Txt 3", selected: true}],
      setter: function(selected) { Messages.info("Selected " + selected);},
      cancel: function() { Messages.info('Canceled'); },
    };}
});


*/

function get(v) {
  if (_.isFunction(v))
    return v();
  else if (_.isString(v))
    return v;
  else return null;
}

Template.wSelector.rendered = function() {
  var context = this.data.context,
        options = {};

  if (_.isArray(context.data))
    options.data = context.data;
  else if (_.isFunction(context.data))
    options.dataAdapter = context.data;

  options.placeholder = this.data.placeholder || context.placeholder;

  this.$("select").select2(options);
};

Template.wSelector.events({
  'click [data-action="save"], submit form': function(e, t) {
    e.preventDefault();
    var context = Template.currentData().context;

    var value = t.find('select').value;

    if (_.isFunction(context.setter))
      context.setter(value);

  },
  'click [data-action="cancel"]': function() {
    var context = Template.currentData().context;
    if (_.isFunction(context.cancel))
      context.cancel();
  }
});
