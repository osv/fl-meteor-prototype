/*
 
 Редактируемое поле textarea, виджет

 Пример использования виджета:

 html:

 <template name="foo">
   {{>wTextArea name="website" context=textarea
             isMarkdown=true alert="alert-warning"             
             placeholder="foobar" addonIcon="fa-phone" }}
 </template>

 где

 name - <textarea name="{{name}}"

 autocomplete, placeholder - опционально

 isMarkdown - используется ли markdown для рендера текста с getter-а

 alert - bootstrap alert

 addonIcon - иконка при редактировании

 context - обект:

 * context.getter, context.setter 
 * undef - сообщение если getter отдаст false
 * undefIcon - иконка если getter отдаст false
 * validator - валидаторы formvalidator 

 Например для выше примера:

 js:

 Template.foo.helpers({
 
  'textarea': function() {
    return {
      getter: function() {return Meteor.user().profile.dShort;},

      setter: function(workDescribe) {
        Meteor.call('change user describe short', workDescribe, function(err){
          if (err)
            Messages.info(err.reason);
          else {
            Messages.info('Изменено краткое описание деятельности');
          }
        });
      },

      validator: {
        stringLength: {
          min: 0,
          max: 214,
          message: 'В кратком описании допустимо 214 символов'
        }
      },

      placeholder: "Например: Производим качественный и быстрый ремонт санузла. Большой опыт работ. Поможем с доставкой материалов",

      undefIcon: "fa fa-exclamation-triangle",
      undef: "Краткое описание не заполнено",
      alert: "alert-warning",
      markdown: false
    };
  }
});

*/

function get(v) {
  if (_.isFunction(v))
    return v();
  else
    return v;
}

Template.wTextArea.helpers({

  'curvalue':  function() { return get(this.context.getter);},

  'msgundef':  function() { return get(this.context.undef);},

  'undefIcon': function() { return get(this.context.undefIcon);},

  alert:       function() { return this.alert       || get(this.context.alert);},

  isMarkdown:  function() { return this.isMarkdown  || get(this.context.markdown);},

  placeholder: function() { return this.placeholder || get(this.context.placeholder);},

  'edit': function() { 
    // создадим new ReactiveVar() если нет в data, ее мы передадим шаблону формы
    if (!this.reactiveVar) {
      console.log('wTextArea, created reactive var');
      this.reactiveVar = ReactiveVar(false);
    }
    return this.reactiveVar.get(); },

  // передаем реактивную переменную нашему шаблону
  'reactiveVar': function() { return this.reactiveVar; }
});

Template.wTextArea.events({
  'click [data-action="edit"], dblclick p': function(e, t) {
    this.reactiveVar.set(true);
    Meteor.defer(function() { t.$('textarea').focus(); });
  }
});

// form

Template.wFormTextArea.helpers({
  'curvalue': function() { return get(this.context.getter);},
});

Template.wFormTextArea.rendered = function () {
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

Template.wFormTextArea.events({
  'click [data-action="save"], submit form': function(e, t){
    e.preventDefault();
    var context = Template.currentData().context;

    if (context.validator) {
      t.$('form').data('formValidation').validate();
      if (!t.$('form').data('formValidation').isValid())
        return false;
    }

    var value = t.find('textarea').value;

    if (context.transform) {
      value = context.transform(value);
    }

    Template.currentData().reactiveVar.set(false);

    if (_.isFunction(context.setter))
      context.setter(value);
  },
  'click [data-action="cancel"]': function(){
    console.log('cancel');
    this.reactiveVar.set(false);
  },
});
