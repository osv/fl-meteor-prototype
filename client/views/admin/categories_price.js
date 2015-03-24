// Price template

Template.catPriceEditor.created = function() {
  this.new = ReactiveVar();
};

Template.catPriceEditor.helpers({
  prices: function() { return PriceTmp.find({cat: this.category, p: {$exists: false}}, {sort: {n: 1}}); },

  // редактирование новой позиции прайса
  new: function() { return Template.instance().new.get();  },
});

Template.catPriceEditor.events({
  'click [data-action="newPrice"]': function(e, t) {
    t.new.set(true);
    Meteor.defer(function() { t.find('input[name="newPrice"]').focus(); });
  },

  'click [data-action="saveNewPrice"]': function (e, t) {
    e.preventDefault();
    t.new.set(false);
    var name = t.find('input[name="newPrice"]').value,
        volume = t.find('select[name="newVol"]').value,
        category = t.data.category;
    Meteor.call('insert-priceTmp', name, category, volume, function (err){
      if (err)
        Messages.info(err.reason);
    });
  },
  'click [data-action="cancelNewPrice"]': function (e, t) {
    t.new.set(false);
  },
});

Template.catPriceItem.created = function() {
  this.edit = ReactiveVar();
  // показываем детали по умолчанию, если есть детали
  // Так как удалить нельзя, кешируем в this количество
  this.detailsNum = PriceTmp.find({cat: this.data.cat, p: this.data._id}).count();  
  this.showDetails = ReactiveVar(this.detailsNum > 0);
  this.newDetail = ReactiveVar();
};

Template.catPriceItem.helpers({
  edit: function() { return Template.instance().edit.get();  },
  showDetails: function() { return Template.instance().showDetails.get(); },

  // елементы родителем которых является этот итем, тоесть детальный список
  detailsCount: function(cursor) {
    return Template.instance().detailsNum;
  },
  details: function() {
    return PriceTmp.find({cat: this.cat, p: this._id}, {sort: {n: 1}});
  },

  // редактирование новой детальной позиции?
  newDetail: function() { return Template.instance().newDetail.get(); }
});

Template.catPriceItem.events({
  // редак. прайса
  'dblclick [data-action="editPr"]': function(e, t) {
    t.edit.set(true);
  },
  'click [data-action="cancelPr"]': function(e, t) {
    t.edit.set(false);
  },
  'click [data-action="savePr"]': function(e, t) {
    e.preventDefault();
    t.edit.set(false);
    var name = t.find('input[name="price"]').value,
        volume = t.find('select').value;
    PriceTmp.update(t.data._id, {$set: {n: name, v: volume}});
  },

  // удаление/востановление
  'click [data-action="rmPrice"]': function(e, t) {
    if (PriceTmp.find({p: this._id, rm: {$ne: true}}).count()) {
      Messages.info('Необходимо удалить детальный список сперва');
      return;
    }
    PriceTmp.update(this._id, {$set: {rm: true}});
  },
  'click [data-action="restorePrice"]': function(e, t) {
    PriceTmp.update(this._id, {$set: {rm: false}});
  },

  // показ/скрыв. списка детального прайса
  'click [data-toggle="priceDet"]': function(e, t) {
    t.showDetails.set( !t.showDetails.get());
  },

  // показ формы нофой позиции детального прайса
  'click [data-action="newDetPrice"]': function(e, t) {
    t.newDetail.set(true);
    Meteor.defer(function() { t.find('input[name="newDetPrice"]').focus(); });
  },

  // сохраниение ноыой позиции детального прайса
  'click [data-action="saveNewDetPrice"]': function (e, t) {
    e.preventDefault();
    t.newDetail.set(false);
    var name = t.find('input[name="newDetPrice"]').value,
        volume = t.find('select[name="newDetVol"]').value,
        category = t.data.cat,
        parent = t.data._id;
    
    Meteor.call('insert-priceTmp', name, category, volume, parent, function (err){
      if (err)
        Messages.info(err.reason);
    });
  },
  'click [data-action="cancelNewDetPrice"]': function (e, t) {
    t.newDetail.set(false);
  },
});

Template.catPriceDetItem.created = function() {
  this.edit = ReactiveVar();
};

Template.catPriceDetItem.helpers({
  edit: function() { return Template.instance().edit.get(); },
});

Template.catPriceDetItem.events({
  // edit detail price item
  'dblclick [data-action="editPrDet"]': function(e, t) {
    console.log('edit', t);
    t.edit.set(true);
  },
  'click [data-action="cancelPrDet"]': function(e, t) {
    t.edit.set(false);
  },
  // done editing of current detail price item
  'click [data-action="savePrDet"]': function(e, t) {
    e.preventDefault();
    t.edit.set(false);
    var name = t.find('input[name="price"]').value,
        volume = t.find('select').value;
    PriceTmp.update(t.data._id, {$set: {n: name, v: volume}});
  },

  // удаление/востановление
  'click [data-action="rmPriceDet"]': function(e, t) {
    PriceTmp.update(this._id, {$set: {rm: true}});
  },
  'click [data-action="restorePriceDet"]': function(e, t) {
    if (PriceTmp.find({_id: this.p, rm: true}).count()) {
      Messages.info("Сперва востановите родительскую позицию");
      return;
    }
    PriceTmp.update(this._id, {$set: {rm: false}});
  },

});

Template.catPriceVolSelect.rendered = function() {
  var select = this.$('select');

  select.select2({
    data: _.map(CFG.volumes,    // ["услуга", "тонна", "м3", "м2"];
                function(item) { return {id: item, text: item};} )
  });

  if (this.data.value)
    select.val( this.data.value ).trigger('change');
};
