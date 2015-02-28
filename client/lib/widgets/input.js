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

 context - обект

 * context.getter, context.setter 
 * undef - сообщение если getter отдаст false
 * undefIcon - иконка если getter отдаст false
 * validator - валидаторы formvalidator 

 Наппример для выше примера:

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


Template.wInput.created = function() {
  this.data.context.$edit$ = ReactiveVar(false);
};

Template.wInput.helpers({

  'curvalue': function() { return get(this.context.getter);},

  'msgundef': function() { return get(this.context.undef);},

  'undefIcon': function() { return get(this.context.undefIcon);},

  'isWebPage': function() {
    var v = get(this.context.getter);
    return (v && v.match(/^http/)) ? true : false;
  },
  
  'edit': function() { return this.context.$edit$.get(); },
});

Template.wInput.events({
  'click [data-action="edit"]': function(e, t) {
    Template.currentData().context.$edit$.set(true);
    Meteor.defer(function() { t.$('input').focus(); });
  }
});

// form

Template.wFormInput.helpers({
  'curvalue': function() { return get(this.context.getter);},
});

Template.wFormInput.rendered = function () {

  if (_.isFunction(this.data.context.rendered)) {
    this.data.context.rendered(this);
  }
  if (_.isObject(this.data.context.validator)) {
    var fields = {};
    fields[this.data.name] = {validators: this.data.context.validator};
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

    context.$edit$.set(false);

    if (_.isFunction(context.setter))
      context.setter(value);
  },
  'click [data-action="cancel"]': function(){
    Template.currentData().context.$edit$.set(false);
  },
});
