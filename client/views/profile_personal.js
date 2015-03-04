/*

 Session.get("currentProfileModal")  - переменная которая содержит текущое модальное окно

 Тоесть, здесь чтобы показать форму:

 ... .js
 Session.set("currentProfileModal", "foo"); 
 $('#profileModal').modal('show');           // #profileModal общий айди для модалок здесь

 ... .html
 <template name="foo">
 </template>

*/

var bsValidator = {
  feedbackIcons: {
      valid: 'fa fa-check',
      invalid: 'fa fa-exclamation',
      validating: 'fa fa-refresh'
    },
};

Template.profilePersonal.helpers({
  currentModal: function() {
    return Session.get("currentProfileModal");
  }
});

Template.profileInput.rendered = function(){
  this.$('[data-toggle="popover"]').popover();
};


/* ****************************************************
 
 Смены логин телефона

***************************************************** */

Template.profileLoginPhone.helpers({
  currentPhone: function() {
    return formatPhone('' + Meteor.user().phone);
  },
});

Template.profileLoginPhone.events({
  'click #changeLoginPhone': function(){
    Session.set("currentProfileModal", 'modalChangeLoginPhone');
    $('#profileModal').modal('show');
  },
});

Template.modalChangeLoginPhone.helpers({
  currentPhone: function() {
    return formatPhone('' + Meteor.user().phone);
  }
});

Template.modalChangeLoginPhone.rendered = function() {
  $('#sendSMS').formValidation({
    feedbackIcons: bsValidator.feedbackIcons,
    fields: {
      phone: {
        validators: {
          callback: {
            callback: function(value) {
              return isPhoneValid( cleanPhoneNumber( value ) );
            },
            message: 'Проверьте правильность ввода номера'
          }
        }
      },
    }
  }).on('success.form.fv', function(e) {
    // Prevent form submission
    // http://formvalidation.io/examples/form-submit-twice/
    e.preventDefault();
  });

  $('#confirmSMS').formValidation({
    feedbackIcons: bsValidator.feedbackIcons,
    fields: {
      token: {
        validators: {
          notEmpty: {
            message: "Введите код"
          },
          stringLength: {
            min: 6,
            max: 6,
            message: "Код содержит 6 символов",
          },
        }
      },
    }
  }).on('success.form.fv', function(e) {
    e.preventDefault();
  });

};

Template.modalChangeLoginPhone.events({
  'submit #sendSMS': function(e, t) {
    e.preventDefault();
    var phone = t.find('[name="phone"]').value,
        cleanPhone = cleanPhoneNumber(phone);

    t.$('#sendSMS').data('formValidation').validate();
    if (!t.$('#sendSMS').data('formValidation').isValid())
      return false;

    // первый  этап,  блокируем  формочку,  и при  если  нет  проблем,
    // показываем форму для ввода СМС кода
    t.$("#sendSMS fieldset").prop('disabled', true);

    Meteor.call('change login phone', cleanPhone, function(err){
      if (err) {
        t.$("#sendSMS fieldset").prop('disabled', false);
        Messages.info(err.reason);
      } else {
        t.$("#confirmSMS").show();
      }
    });
    return false;
  },
  'submit #confirmSMS': function(e, t) {
    e.preventDefault();
    var phone = t.find('[name="phone"]').value,
        cleanPhone = cleanPhoneNumber(phone),
        token = t.find('[name="token"]').value;

    t.$('#confirmSMS').data('formValidation').validate();
    if (!t.$('#confirmSMS').data('formValidation').isValid())
      return false;

    Meteor.call('change login phone', cleanPhone, token, function(err){
      if (err)
        Messages.info(err.reason);
      else {
        $('#profileModal').modal('hide');
        Messages.info("Изменен номер телефона на <strong>" + phone + "</strong>");
      }
    });
    return false;
  },
});

/* ****************************************************

 Смена пароля

 **************************************************** */

Template.profileChangePassword.events({
  'click #changePassword': function(){
    Session.set("currentProfileModal", "modalChangePassword");
    $('#profileModal').modal('show');
  },
});

Template.modalChangePassword.rendered = function(){
  $('#password').formValidation({
    framework: 'bootstrap',
    message: 'This value is not valid',
    feedbackIcons: bsValidator.feedbackIcons,
    fields: {
      oldPwd: {
        message: 'Старый пароль',
        validators: {
          notEmpty: {
            message: 'Пароль не может быть пустым'
          }
        }
      },
      newPwd1: {
        message: 'Новый пароль',
        validators: {
          notEmpty: {
            message: 'Введите новый пароль'
          },
          stringLength: {
            min: 6,
            max: 128,
            message: 'Пароль должен содержать не менее 6 символов'
          },
          regexp: {
            regexp: /^[a-zA-Z0-9+_,./-]{6,}$/,
            message: 'Пароль должен содержать символы латыни a-Z и цифры.'
          }
        }
      },
      newPwd2: {
        validators: {
          notEmpty: {
            message: 'Поле не должно быть пустым'
          },
          identical: {
            field: 'newPwd1',
            message: 'Повторите введенный выше пароль'
          }
        }
      }
    }
  }).on('success.form.fv', function(e) {
    e.preventDefault();
  });
};

Template.modalChangePassword.events({
  'submit #password': function(e, t) {
    e.preventDefault();
    var oldPwd = t.find('[name="oldPwd"]').value,
        newPwd1 = t.find('[name="newPwd1"]').value,
        newPwd2 = t.find('[name="newPwd2"]').value;

    t.$('#password').data('formValidation').validate();
    if (!t.$('#password').data('formValidation').isValid())
      return false;

    Meteor.call('change password', oldPwd, newPwd1, function(err){
      if (err)
        Messages.info(err.reason);
      else {
        $('#profileModal').modal('hide');
        Messages.info("Пароль изменен");
      }
    });
    return false;
  },
});

/* ****************************************************

 Контактное лицо

 **************************************************** */

Template.profileContactName.helpers({
  context: function() {
    return {

      getter: function() { 
        return Meteor.user().profile.completeName; },

      setter: function(fullName) {
        Meteor.call('change user name', fullName, function(err){
          if (err)
            Messages.info(err.reason);
          else {
            Messages.info('Контактное имя изменено');
            buildQRCode();
          }
        });
      },
     
      validator: {
        notEmpty: {
          message: 'Не оставляйте контактное лицо пустым'
        },
        stringLength: {
          max: 58,
          min: 2,
          message: 'Допустимо 58 символов'
        }
      },
    };
  }
});


/* ****************************************************

 Краткое описание деятельности мастера

 **************************************************** */

Template.profileOverview.helpers({
  context: function() {
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
    };
  },
});


/* ****************************************************

 Описание деятельности мастера ПОДРОБНОЕ

 **************************************************** */

Template.profileDescribe.helpers({
  context: function() {
    return {
      getter: function() { return Meteor.user().profile.dLong; },

      setter: function(workDescribe) {
        Meteor.call('change user describe long', workDescribe, function(err){
          if (err)
            Messages.info(err.reason);
          else {
            Messages.info('Изменено описание деятельности');
          }
        });
      },

      undefIcon: "fa fa-exclamation-triangle",
      undef: "Краткое описание не заполнено",
      alert: "alert-warning",
      markdown: true,
    };
  }
});

/* ****************************************************

 Web site

 **************************************************** */

Template.profileWebsite.helpers({
  context: function() {
    return {

      getter: function() { 
        return Meteor.user().profile.website; },

      setter: function(webpage) {
        // добавим http:// если нет
        if (webpage && webpage.substr(0, 7) !== 'http://' && webpage.substr(0, 8) !== 'https://') {
          webpage = 'http://' + webpage;
        }

        Meteor.call('change user website', webpage, 
                    function(err) {
                      if (err)
                        Messages.info(err.reason);
                      else {
                        Messages.info('Веб-сайт изменен');
                        buildQRCode();
                      }
                    });
      },

      undef: "Веб-сайт не указан",
      undefIcon: 'fa fa-exclamation',

      validator: {
        uri: {
          message: 'Адрес веб-сайта указан не верно',
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
          message: "Длина URL не должна превышать 72 символов",
        },
      }
    };
  }
});

/* ****************************************************

 Дополнительные контакты

 **************************************************** */

var newContact = new ReactiveVar(false);

// типи контактов,
// При изменении следует изменить и в collection/users.js server/users.js
var contactsTypes = {
  phone: {
    i: 'fa-phone',
    validators:{
      callback: {
        callback: function(value) {
          return isPhoneValid( cleanPhoneNumber( value ) );
        },
        message: 'Проверьте правильность ввода номера'
      }
    }
  },
  email: {
    i: 'fa-envelope',
    placeholder: "john@example.com",
    validators: {
      notEmpty: {
        message: "Введите e-mail"
      },
      regexp: {
        regexp: '^[^@\\s]+@([^@\\s]+\\.)+[^@\\s]+$',
        message: 'Неправильный e-mail адрес'
      }
    }
  },
  skype: {
    i: 'fa-skype',
    placeholder: 'Скайп ID',
    validators: {
      notEmpty: {
        message: "Введите Skype идентификатор"
      },
      regexp: {
        // http://stackoverflow.com/questions/12746862/regular-expressions-for-skype-name-in-php
        regexp: '^[a-zA-Z][a-zA-Z0-9\\.,\\-_]{5,31}$',
        message: 'Проверьте Skype идентификатор'
      }
}
  },
  fax: {
    i: 'fa-fax',
    validators:{
      callback: {
        callback: function(value) {
          return isPhoneValid( cleanPhoneNumber( value ) );
        },
        message: 'Проверьте правильность ввода номера'
      }
    }
  }
};

Template.profileContacts.events({
  // будет показана формочка добавления нового контакта тип которого указан в [data-action]
  'click li a': function(e, t){
    var action = e.target.dataset.action; // data-action attribute
    if (_.contains(_.keys(contactsTypes), action)) {
      newContact.set(action);
      Meteor.defer(function() { t.$('input').focus(); });
    }
  }
});

Template.profileContacts.helpers({
  haveContacts: function(){
    return Meteor.user().profile.contacts;
  },
  newContact: function() { return newContact.get(); }
});

Template.profileContactsTable.helpers({
  contacts:  function(type) {
    return _.where(Meteor.user().profile.contacts, {type: type});
  },
});

//contact item (obj {type, contact})
Template.profileContactRow.helpers({
  formatContact: function() {
    if (this.type === 'phone' || this.type === 'fax')
      return formatPhone(this.contact);
    else
      return this.contact;
  }
});

Template.profileContactRow.events({
  'click [data-action="rm"]': function() {
    var self = this;
    if (confirm('Удалить контакт "' + self.contact + '"?'))
      Meteor.call('user rm contact', self.type, self.contact, function(err){
        if (err)
          Messages.info(err.reason);
        else {
          Messages.info('Контакт удален ' + self.contact);
          buildQRCode();
        }
      });
  }
});

//form
Template.formNewContact.rendered = function(){
  this.$('form').formValidation({
    fields: {
      contact: {
        validators: contactsTypes[ newContact.get() ].validators
      },
    }
  }).on('success.form.fv', function(e) {
    e.preventDefault();
  });

  // bootstrap form phone helper
  var $phone = this.$('.bfh-phone');
  if ($phone)
    $phone.bfhphone($phone.data());
};

Template.formNewContact.helpers({
  placeholder: function() { return contactsTypes[ newContact.get() ].placeholder; },
  icon:        function() { return contactsTypes[ newContact.get() ].i; },
  isPhone:     function() { return newContact.get() === 'phone' || newContact.get() === 'fax'; },
  defaultValue:function() {
    // дефолтный телефон для контакта - телефон входа
    if (newContact.get() === 'phone') {
      return Meteor.user().phone;
    }
    return '';
  }
});

Template.formNewContact.events({
  'click [data-action="cancel"]': function(){
    newContact.set(false);
  },
  'submit form': function(e, t){
    e.preventDefault();

    t.$('form').data('formValidation').validate();
    if (!t.$('form').data('formValidation').isValid())
      return false;

    var contact = t.find('[name="contact"]').value,
        type = newContact.get();

    if (type === 'phone' || type === 'fax')
      contact = cleanPhoneNumber(contact);

    newContact.set();

    Meteor.call('user add contact', type, contact, function(err){
      if (err)
        Messages.info(err.reason);
      else {
        Messages.info('Контакт добавлен ' + contact);
        buildQRCode();
      }
    });
    return false;
  },
});

/* ****************************************************

 QR код VCARD-а

 **************************************************** */

var qrcode;

Template.profileQRcode.helpers({
  user: function() {
    Meteor.user();
  }
});

function buildQRCode () {
  var vcard = userVCARD();
  
  qrcode.makeCode(vcard);
  console.log('vcard:\n%s', vcard);
}

Template.profileQRcode.rendered = function(){
  this.$('[data-toggle="popover"]').popover();

  qrcode = new QRCode(document.getElementById("qr-profile"), {
    width : 200,
    height : 200,
    colorDark : "green",
    colorLight : "#ffffff",
    correctLevel : QRCode.CorrectLevel.M,
  });

  buildQRCode();

};

/* ****************************************************

 Аватар

 **************************************************** */

var uploadingAvatar = new ReactiveVar(false), // spinner
    avatarRealSize, avatarId,
    cropCoords;

Template.profileAvatar.events({
  'click [data-action="avatar"]': function() {
    Session.set("currentProfileModal", 'modalAvatarSelect');
    $('#profileModal').modal('show');
  },
  'click [data-action="remove"]': function() {
    if (confirm('Удалить фотографию?'))
      Meteor.call('avatar-remove', function(err) {
        if (err) {
          Messages.info(err.reason);
        } else {
          Messages.info('Фотография удалена');
        }
      });
  },
});

Template.profileAvatar.helpers({
  myId: function() {return Meteor.userId; },
  haveAvatart: function() { return Meteor.user().profile.avatar; }
});

Template.modalAvatarSelect.helpers({
  myId: function() {return Meteor.userId; },
  isLoading: function() {
    return uploadingAvatar.get();
  },
});

Template.modalAvatarSelect.events({
  'change #file': function(event, template) {
   var file = event.currentTarget.files[0];
   if (!file.type.match(/^image\//)) {
     Messages.info("Файл не является изображением");
     return;
   }
   if (file.size > 600000) {
     Messages.info("Файл слишком большой");
     return;
   }   
   var reader = new FileReader();
   reader.onload = function(fileLoadEvent) {
     uploadingAvatar.set(true);
     Meteor.call('avatar-upload', file.type, file.name, reader.result, function(err, res){
       uploadingAvatar.set(false);
       if (err) {
         Messages.info(err.reason);
       } else {
         avatarRealSize = res.size;
         avatarId = res.id;
         Session.set("currentProfileModal", 'modalAvatarCrop');
       }
     });
   };
   reader.readAsBinaryString(file);
 }
});

Template.modalAvatarCrop.helpers({
  cropId: function() {return avatarId;},
  isLoading: function() {return uploadingAvatar.get();}
});

Template.modalAvatarCrop.rendered = function() {
  var t = this,
      jcrop_api,
      boundx,
      boundy,

      $preview = t.$('#jcrop-preview-pane'),
      $pcnt = t.$('#jcrop-preview-pane .avatar-container'),
      $pimg = t.$('#jcrop-preview-pane .avatar-container img'),

      xsize = $pcnt.width(),
      ysize = $pcnt.height();

  t.$('#crop').Jcrop({
    onChange: showPreview,
    onSelect: showPreview,
    bgColor: 'black',
    bgOpacity: 0.6,
    bgFade: true,
    trueSize: [avatarRealSize.width, avatarRealSize.height],
    aspectRatio: 1
  },function(){
    // Use the API to get the real image size
    var bounds = this.getBounds();
    boundx = bounds[0];
    boundy = bounds[1];
    // Store the API in the jcrop_api variable
    jcrop_api = this;

    jcrop_api.animateTo([20, 20, avatarRealSize.width-40, avatarRealSize.height, 40]);


    // Move the preview into the jcrop container for css positioning
    $preview.appendTo(jcrop_api.ui.holder);
  });

  function showPreview(c)
  {
    // сохраняем координаты
    cropCoords = c;
    if (parseInt(c.w) > 0)
    {
      var rx = xsize / c.w;
      var ry = ysize / c.h;

      $pimg.css({
        width: Math.round(rx * boundx) + 'px',
        height: Math.round(ry * boundy) + 'px',
        marginLeft: '-' + Math.round(rx * c.x) + 'px',
        marginTop: '-' + Math.round(ry * c.y) + 'px'
      });
    }
  }
};

Template.modalAvatarCrop.events({
  'click [data-action="save"]': function() {
    uploadingAvatar.set(true);
    Meteor.call('avatar-commit', avatarId, cropCoords, function(err){
      uploadingAvatar.set(false);
      if (err) {
        Messages.info(err.reason);
      } else {
        Session.set("currentProfileModal", 'modalAvatarCrop');
        Messages.info('Фото установлено');
        $('#profileModal').modal('hide');
      }
    });
  },
});
/* ****************************************************

 Вспомагательный шаблон, номер телефона ввода

 **************************************************** */
Template.profileInputHelperPhone.rendered = function(){
  // Инициализация bootstrap-phone-helper
  var $phone = this.$('.bfh-phone');
  $phone.bfhphone($phone.data());
};

