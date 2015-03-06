/*

 Виджет селект

 Пример:

 html:
 {{wSelect context=selectContext
           addonIcon="fa fa-place"
           placeholder="Select some items}}
 
 js:

 Template.sometemplate.helpers({
  selectContext: function() {
    return {
      data: [{id: 'foo1', text: "Txt 2"}, {id: 'foo2', text: "Txt 3", selected: true}],

      getter: 'foo2'; // другой способ установки поумолчанию, вместо selected в data

      setter: function(selected) { Messages.info("Selected " + selected);},

      placeholder: 'abcd efg'   // другой способ установить плейсхолдер для select2
    };}
});

 Пример но только формы с кнопками сохранить, отменить:

 html:
 {{wFormSelect context=selectContext
           addonIcon="fa fa-place"
               placeholder="Select some items}}
 
 js:

 Template.sometemplate.helpers({
  selectContext: function() {
    return {
      data: [{id: 'foo1', text: "Txt 2"}, {id: 'foo2', text: "Txt 3", selected: true}],

      getter: 'foo2'; // другой способ установки поумолчанию, вместо selected в data

      setter: function(selected) { Messages.info("Selected " + selected);},

      cancel: function() { Messages.info('Canceled'); },

      placeholder: 'abcd efg'   // другой способ установить плейсхолдер для select2
    };}
});

*/

function get(v) {
  if (_.isFunction(v))
    return v();
  else
    return v;
}

Template.wSelect.created = function() {
  this.reactiveVar = new ReactiveVar(); // edit
};

Template.wSelect.helpers({
  curvalue: function() {
    var context = this.context;
    if (_.isArray(context.data) && context.getter) {
      var v = _.findDeep(context.data, {id: get(context.getter)});
      v ? v.text : false;
    }
    else
      return false;
  },

  msgundef: function() { return this.msgundef || get(this.context.msgundef);},

  undefIcon: function() { return this.undefIcon ||get(this.context.undefIcon);},

  edit: function() {return Template.instance().reactiveVar.get(); },

  // деалем свой контектс, подмешиваем в setter - установку реактивной
  // переменны, чтобы уйти с режима редактирования. Остальное что нужно, передаем как есть
  context: function() {
    var context = this.context,
        reactiveVar = Template.instance().reactiveVar;

    return {
      data: context.data,
      getter: context.getter,
      placeholder: this.placeholder || get(context.placeholder),
      addonIcon: this.addonIcon || get(context.placeholder),
      setter: function(value){
        reactiveVar.set(false);
        if (context.setter) {
          context.setter(value);
        }
      },
      cancel: function() { reactiveVar.set(false); }
    };
  }
});

Template.wSelect.events({
  'click [data-action="edit"]': function(e, t) {
    t.reactiveVar.set(true);
  }
});

Template.wFormSelect.rendered = function() {
  var context = this.data.context,
        options = {};

  if (_.isArray(context.data))
    options.data = context.data;
  else if (_.isFunction(context.data))
    options.dataAdapter = context.data;

  options.placeholder = this.data.placeholder || get(context.placeholder);

  var select = this.$("select");

  select.select2(options);

  // установим значение по умолчанию
  if (context.getter)
    select.val( get(context.getter) ).trigger('change');
};

Template.wFormSelect.helpers({
  addonIcon: function() { return this.addonIcon || get(this.context.addonIcon);},
});

Template.wFormSelect.events({
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
