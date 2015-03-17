Template.adminCategories.helpers({
  rootCategory: function() {
    return {n: "Категории в системе"};
  }
});

Template.catTreeNodeTemplate.helpers({

  hasChildren: function() { return Categories.find({p: this._id}).count() > 0; },

  children: function() { 
    console.log(Categories.find({p: this._id}).fetch());
    return Categories.find({p: this._id}); },

});


Template.catItem.created = function(){
  this.new = new ReactiveVar(); // форма новой подкатегории если true
  this.edit = new ReactiveVar();
};

Template.catItem.helpers({
  edit: function() { return Template.instance().edit.get();  },
  new: function() { return Template.instance().new.get();  },
  disabledRestore: function() {
    // если отцовская категория не удалена, то мы можем востановить и эту
    var cat = Categories.findOne(this.p);
    return (cat && cat.rm) ? 'disabled' : '';
  }
});

Template.catItem.events({
  // удаление/востановление
  'click [data-action="remove"]': function (e, t) {
    var id = Template.currentData().id;

    if ( Categories.find( {p: id, rm: {$ne: true } } ).count() > 0 ) {
      alert("Вы должны сперва удалить все категории что ниже этой.");
      return;
    }
    Categories.update(id, {$set: {rm: true}});
  },
  'click [data-action="restore"]': function (e, t) {
    var id = Template.currentData().id;

    Categories.update(id, {$set: {rm: false}});
  },

  // редактирование текущей категории
  'click [data-action="edit"]': function(e, t) {
    t.edit.set(true);
  },
  'click [data-action="cancel"]': function (e, t) {
    t.edit.set(false);
  },
  'click [data-action="save"], submit form': function (e, t) {
    e.preventDefault();
    var newName = t.find('input[name="newName"]').value,
        id = Template.currentData().id;

    Categories.update(id, {$set: {n: newName}});
    t.edit.set(false);
  },

  // создание новой подкатегории
  'click [data-action="new"]': function(e, t) {
    t.new.set(true);
  },
  'click [data-action="cancelNew"]': function (e, t) {
    t.new.set(false);
  },
  'click [data-action="saveNew"], submit form': function (e, t) {
    e.preventDefault();
    var name = t.find('input[name="category"]').value,
        parentId = Template.currentData().id;
    
    // сохраняем новую категорию
    Categories.insert({p: parentId, // отцовский айди
                       n: name,     // название категории
                      });
    t.new.set(false);              // все, выключаем форму редактирования
  },
});
