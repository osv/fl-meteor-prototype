/*
 
 Редактируемое поле, виджет

 Пример использования виджета:

 html:

 <template name="foo">
   {{>wInput name="website" context=webinput
             autocomplete="off" placeholder="foobar" addonIcon="fa-phone" }}
 </template>

 где

 name - <input name="{{name}}"

 autocomplete, placeholder - опционально

 addonIcon - иконка при редактировании

 context - обект

 * context.getter, context.setter 
 * undef - сообщение если getter отдаст false
 * undefIcon - иконка если getter отдаст false
 * validator - валидаторы formvalidator 

 Например для выше примера:

 js:

 Template.foo.helpers({
 
  'webinput': function() {
    return {

      getter: function() { 
        return Meteor.user().profile.website; },

      setter: function(webpage) {
        Meteor.call('change user website', webpage, 
                    function(err) {
                      if (err)
                        Messages.info(err.reason);
                      else {
                        Messages.info('Website изменен');
                        buildQRCode();
                      }
                    });
      },

      undef: "Веб сайт не указан",
      undefIcon: 'fa fa-exclamation',

      validator: {
        uri: {
          message: 'Веб сайт не валидный',
          transformer: function($field, validator) {
            // Get the field value
            var value = $field.val();
            // Check if it doesn't start with http:// or https://
            if (value && value.substr(0, 7) !== 'http://' && value.substr(0, 8) !== 'https://') {
              // then prefix with http://
              value = 'http://' + value;
            }
            // Return new value
            return value;
          }
        },
        stringLength: {
          max: 64,
          message: "Длина URL не должна быть более 72 символов",
        },
      },
    };
  }
});

 Можно использовать только форму с кнопками сохранить - отменить

 html:
 {{>wFormInput context=inputcontext
               placeholder="abc deef"
               addonIcon="fa-phone"
               name="abc"
       }}

 js:
 Template.FooBar.helpers({
 inputcontext: function() {
   return: {
     name: 'contact',

     cancel: function() {Messages.info('cancelled')},

     setter: function(value) {Messages.info('set')},

     getter: 'foo bar',

     // хук на рендер <input>
     rendered: function(t) { t.find('input); },

     placeholder: 'abc def',

     addonIcon: 'fa-phone',

     validator: {
          notEmpty: {
            message: 'Поле не может быть пустым'
          }
      }
   }

 }

 });

*/

function get(v) {
  if (_.isFunction(v))
    return v();
  else if (_.isString(v))
    return v;
  else return null;
}

Template.wInput.created = function() {
  this.reactiveVar = new ReactiveVar(); // edit
};

Template.wInput.helpers({
  context: function() {
    var context = this.context,
        reactiveVar = Template.instance().reactiveVar;
    return {
      placeholder: this.placeholder || get(context.placeholder),
      addonIcon: this.addonIcon || get(context.addonIcon),
      getter: context.getter,
      validator: context.validator,
      name: this.name || get(context.name),
      setter: function(value){
        reactiveVar.set(false);
        if (context.setter) {
          context.setter(value);
        }
      },
      cancel: function() { reactiveVar.set(false); },
      rendered: context.rendered,
    };
  },


  'curvalue': function() { return get(this.context.getter);},

  'name': function() { return this.name || get(this.context.name);},

  'msgundef': function() { return this.msgundef || get(this.context.undef);},

  'undefIcon': function() { return this.undefIcon || get(this.context.undefIcon);},

  'autocomplete': function() { return this.autocomplete || get(this.context.autocomplete);},

  'isWebPage': function() {
    var v = get(this.context.getter);
    return (v && v.match(/^http/)) ? true : false;
  },
  
  edit: function() {return Template.instance().reactiveVar.get(); },
});

Template.wInput.events({
  'click [data-action="edit"]': function(e, t) {
    t.reactiveVar.set(true);
    Meteor.defer(function() { t.$('input').focus(); });
  }
});

// form

Template.wFormInput.helpers({
  curvalue: function() { return get(this.context.getter);},
  placeholder: function() { return this.placeholder || get(this.context.placeholder);},
  addonIcon: function() { return this.addonIcon || get(this.context.addonIcon);},
  autocomplete: function() { return this.autocomplete || get(this.context.autocomplete);},
  name: function() { return this.name || get(this.context.name);},
});

Template.wFormInput.rendered = function () {
  var context = this.data.context;

  // инициализация валидатора если есть он
  if (_.isObject(context.validator)) {
    var fields = {};
    fields[ this.data.name || context.name ] = {validators: context.validator};
    this.$('form').formValidation( {fields: fields} ).on('success.form.fv', function(e) {
      e.preventDefault();
    });
  }

  // дополнительный хук на rendered
  if (_.isFunction(context.rendered)) {
    context.rendered(this);
  }
};

Template.wFormInput.events({
  'click [data-action="save"], submit form': function(e, t){
    e.preventDefault();
    var context = Template.currentData().context;

    if (context.validator) {
      t.$('form').data('formValidation').validate();
      if (!t.$('form').data('formValidation').isValid())
        return false;
    }

    var value = t.find('input').value;
    if (_.isFunction(context.transform)) {
      value = context.transform(value);
    }

    if (_.isFunction(context.setter))
      context.setter(value);
  },
  'click [data-action="cancel"]': function(){
    var context = Template.currentData().context;
    if (_.isFunction(context.cancel))
      context.cancel();
  },
});
