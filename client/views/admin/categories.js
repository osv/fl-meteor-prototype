Template.adminCategories.created = function () {
  this.bulkUploading = ReactiveVar();
  this.new = ReactiveVar();
};

Template.adminCategories.helpers({
  rootCategories: function() {
    // рут категории те которые не имеют отцов
    return Categories.find({p: {$exists: false}});
  },

  bulkUpload: function() { 
    return Template.instance().bulkUploading.get(); },

  new: function() { return Template.instance().new.get(); },
  contextNew: function() {
    var rNew = Template.instance().new;
    return {
      name: 'category',

      cancel: function() {rNew.set(false);},

      setter: function(value) {
        rNew.set(false);
        Meteor.call('insert-cat', value, function(err) {
          if (err)
            Messages.info(err.reason);
        });
      },

      rendered: function(t) { t.find('input'); },

      placeholder: 'Например: Архитектура и проектирование',

      validator: {
        stringLength: {
          min: 6,
          max: 64,
          message: 'Допустимо 6-64 символов'
        },
        notEmpty: {
          message: "Не должно быть пустым"
        },
      }
    };
  }

});

Template.adminCategories.events({
  'click [data-action="import"]': function(e, t) {
    var textarea = t.find('[name="import"]');
    t.bulkUploading.set(true);
    Meteor.call('import-cats', textarea.value, function(err){
      t.bulkUploading.set(false);
      if (err)
        Messages.info(err.reason);
      else
        textarea.value = '';
    });
  },
  'click [data-action="newRoot"]': function(e, t) {
    t.new.set(true);
  }
});

Template.catTreeNodeTemplate.helpers({
  children: function() { return Categories.find({p: this._id}); },
});


Template.catItem.created = function(){
  this.new = new ReactiveVar(); // форма новой подкатегории если true
  this.edit = new ReactiveVar();
  this.editPrice = new ReactiveVar();
};

Template.catItem.helpers({
  edit: function() { return Template.instance().edit.get();  },
  new: function() { return Template.instance().new.get();  },
  editPrice: function() { return Template.instance().editPrice.get();  },

  prices: function() { return PriceTmp.find({cat: this.ctx._id}).count(); },

  disabledRestore: function() {
    // если отцовская категория не удалена, то мы можем востановить и эту
    var cat = Categories.findOne(this.ctx.p);
    return (cat && cat.rm) ? 'disabled' : '';
  },

  contextEdit: function() {
    var rEdit = Template.instance().edit,
        id = this.ctx._id,
        curCat = this.ctx.n;
    
    return {
      name: 'category',

      cancel: function() {rEdit.set(false);},

      getter: curCat,

      setter: function(value) {
        rEdit.set(false);
        Categories.update(id, {$set: {n: value}});
      },

      rendered: function(t) { t.find('input'); },

      placeholder: 'Например: Архитектура и проектирование',

      validator: {
        stringLength: {
          min: 6,
          max: 64,
          message: 'Допустимо 6-64 символов'
        },
        notEmpty: {
          message: "Не должно быть пустым"
        },
      }
    };
  },
  contextNew: function() {
    var rNew = Template.instance().new,
        id = this.ctx._id;
    
    return {
      name: 'category',

      cancel: function() {rNew.set(false);},

      setter: function(value) {
        rNew.set(false);
        Meteor.call('insert-cat', value, id, function(err) {
          if (err)
            Messages.info(err.reason);
        });
      },

      rendered: function(t) { t.find('input'); },

      placeholder: 'Например: Замена унитаза',

      validator: {
        stringLength: {
          min: 6,
          max: 64,
          message: 'Допустимо 6-64 символов'
        },
        notEmpty: {
          message: "Не должно быть пустым"
        },
      }
    };
  }
});

Template.catItem.events({
  // удаление/востановление
  'click [data-action="remove"]': function (e, t) {
    var id = t.data.ctx._id;

    if ( Categories.find( {p: id, rm: {$ne: true } } ).count() > 0 ) {
      alert("Вы должны сперва удалить все категории что ниже этой.");
      return;
    }
    Categories.update(id, {$set: {rm: true}});
  },
  'click [data-action="restore"]': function (e, t) {
    var id = t.data.ctx._id;

    Categories.update(id, {$set: {rm: false}});
  },

  // редактирование текущей категории
  'click [data-action="edit"]': function(e, t) {
    t.edit.set(true);
  },
  'dblclick [data-action="dEdit"]': function(e, t) {
    t.edit.set(true);
  },

  // создание новой подкатегории
  'click [data-action="new"]': function(e, t) {
    t.new.set(true);
  },

  // показать скрыть цены
  'click [data-action="showPrice"]': function(e, t) {
    t.editPrice.set(true);
  },
  'click [data-action="hidePrice"]': function(e, t) {
    t.editPrice.set(false);
  },
});


Meteor.startup(function(){

  var wrappedFind = Categories.find;

  Categories.find = function () {
    var cursor = wrappedFind.apply(this, arguments);
//    console.log("find");
    return cursor;
  };
});

Meteor.startup(function(){

  var wrappedFind = PriceTmp.find;

  PriceTmp.find = function () {
    var cursor = wrappedFind.apply(this, arguments);
    console.log("findPrice");
    return cursor;
  };
});
