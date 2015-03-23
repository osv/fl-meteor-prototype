Template.adminCategories.created = function () {
  this.bulkUploading = ReactiveVar();
};

Template.adminCategories.helpers({
  rootCategory: function() {
    return {n: "Категории в системе"};
  },
  bulkUpload: function() { 
    return Template.instance().bulkUploading.get(); }
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
  }
});

Template.catTreeNodeTemplate.helpers({

  hasChildren: function() { return Categories.find({p: this._id}).count() > 0; },

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

  hasChildren: function() { return Categories.find({p: this.ctx._id, rm: {$ne: true}}).count() > 0; },

  disabledRestore: function() {
    // если отцовская категория не удалена, то мы можем востановить и эту
    var cat = Categories.findOne(this.ctx.p);
    return (cat && cat.rm) ? 'disabled' : '';
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
    Meteor.defer(function() { t.find('input').focus(); });
  },
  'click [data-action="cancel"]': function (e, t) {
    t.edit.set(false);
  },
  'click [data-action="save"], submit form': function (e, t) {
    e.preventDefault();
    var newName = t.find('input[name="newName"]').value,
        id = t.data.ctx._id;

    Categories.update(id, {$set: {n: newName}});
    t.edit.set(false);
  },

  // создание новой подкатегории
  'click [data-action="new"]': function(e, t) {
    t.new.set(true);
    Meteor.defer(function() { t.find('input').focus(); });
  },
  'click [data-action="cancelNew"]': function (e, t) {
    t.new.set(false);
  },
  'click [data-action="saveNew"], submit form': function (e, t) {
    e.preventDefault();
    var name = t.find('input[name="category"]').value,
        parentId = t.data.ctx._id;
    
    // сохраняем новую категорию
    Categories.insert({p: parentId, // отцовский айди
                       n: name,     // название категории
                      });
    t.new.set(false);              // все, выключаем форму редактирования
  },

  // показать скрыть цены
  'click [data-action="showPrice"]': function(e, t) {
    t.editPrice.set(true);
  },
  'click [data-action="hidePrice"]': function(e, t) {
    t.editPrice.set(false);
  },
});
