Template.AdminThemeTest.rendered = function() {
  this.$('[data-toggle="popover"]').popover();
  this.$('[data-toggle="tooltip"]').tooltip();
};

Template.AdminThemeTest.helpers({
  ctxInput1: {
    placeholder: "Плейсхолдер", 

    setter: function(text) {
          Messages.info(text);
    },
   
    getter: "",

    validator: {
      notEmpty: {
        message: 'Не оставляйте поле пустым'
      },
    },
  },
  ctxInput2: {
    placeholder: "Плейсхолдер", 

    setter: function(text) {
      Messages.info(text);
    },

    validator: {
      notEmpty: {
        message: 'Не оставляйте поле пустым'
      },
    },
    undefIcon: "fa fa-exclamation-triangle",
    undef: "Краткое описание не заполнено",
    alert: "alert-warning",
  },

  ctxTextArea1: {
    getter: function() {return "## Nullam quis\n\nrisus eget urna mollis\n\n Ornare vel eu leo. ";},

    undefIcon: "fa fa-exclamation-triangle",
    undef: "Краткое описание не заполнено",
    alert: "alert-warning",
    markdown: true
  },
  ctxTextArea2: {
    undefIcon: "fa fa-exclamation-triangle",
    undef: "Поле не заполнено",
    alert: "alert-warning",
    markdown: true
  },

  placeselect1: function() {
    return {
      placeholder: 'Начните набирать город, регион или страну',
      data: S2Adaptors.anyplace,
      setter: function(place) {
        Messages.info(place); 
      }
    };
  },
  placeselect2: function() {
    return {
      placeholder: 'регион',
      data: S2Adaptors.regions,
      setter: function(place) {
        Messages.info(place); 
      },
      msgundef: "-"
    };
  }

});
