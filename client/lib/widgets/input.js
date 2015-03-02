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

*/

function get(v) {
  if (_.isFunction(v))
    return v();
  else if (_.isString(v))
    return v;
  else return null;
}

Template.wInput.helpers({

  'curvalue': function() { return get(this.context.getter);},

  'msgundef': function() { return get(this.context.undef);},

  'undefIcon': function() { return get(this.context.undefIcon);},

  'isWebPage': function() {
    var v = get(this.context.getter);
    return (v && v.match(/^http/)) ? true : false;
  },
  
  'edit': function() { 
    // создадим new ReactiveVar() если нет в data, ее мы передадим шаблону формы
    if (!this.reactiveVar) {
      console.log('wInput, created reactive var');
      this.reactiveVar = ReactiveVar(false);
    }
    return this.reactiveVar.get(); },

  // передаем реактивную переменную нашему шаблону
  'reactiveVar': function() { return this.reactiveVar; }
});

Template.wInput.events({
  'click [data-action="edit"]': function(e, t) {
    this.reactiveVar.set(true);
    Meteor.defer(function() { t.$('input').focus(); });
  }
});

// form

Template.wFormInput.helpers({
  'curvalue': function() { return get(this.context.getter);},
});

Template.wFormInput.rendered = function () {
  var context = this.data.context;
  if (_.isFunction(context.rendered)) {
    context.rendered(this);
  }
  if (_.isObject(context.validator)) {
    var fields = {};
    fields[this.data.name] = {validators: context.validator};
    this.$('form').formValidation( {fields: fields} ).on('success.form.fv', function(e) {
      e.preventDefault();
    });
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

    if (context.transform) {
      value = context.transform(value);
    }

    Template.currentData().reactiveVar.set(false);

    if (_.isFunction(context.setter))
      context.setter(value);
  },
  'click [data-action="cancel"]': function(){
    console.log(this);
    this.reactiveVar.set(false);
  },
});
