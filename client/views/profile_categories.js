var showSelectedByMeOnly = ReactiveVar();
var selectedCat = ReactiveVar();

Template.profileCategories.helpers({
  rootCategories: function() {
    // рут категории те которые не имеют отцов
    return Categories.find({p: {$exists: false}, rm: {$ne: true}}, {sort: {n: 1}});
  },
  showMine: function() { return showSelectedByMeOnly.get() ? 'checked' : ''; }
});

Template.profileCategories.created = function() {
  // установим галочку чтобы показать только мои выбранные если юзер выбрал больше одного
  if (_.isUndefined(showSelectedByMeOnly.get()))
    showSelectedByMeOnly.set(UserCats.find({u: Meteor.userId(), rm: {$ne: true}}).count() > 1);
};

Template.profileCategories.events({
  'change [name="showMine"]': function(e, t) {
    showSelectedByMeOnly.set( e.currentTarget.checked );
  }
});
Template.profileCatTreeNode.helpers({
  show: function() {
    return (                         
      !this.p ||         // обязательно показываем если это рут раздел
        !(               // или не включен показ только выбранных разделов
          showSelectedByMeOnly.get() &&
            !UserCats.findOne({
              u: Meteor.userId(), cat: this._id, rm: {$ne: true}
            })
        )
    );
  },
  children: function() { return Categories.find({p: this._id, rm: {$ne: true}}, {sort: {n: 1}}); },
});

Template.profileCatItem.created = function(){
  this.load = new ReactiveVar();
};

Template.profileCatItem.helpers({
  set: function() {
    return UserCats.findOne({u: Meteor.userId(), cat: this.ctx._id, rm: {$ne: true}});
  },
  isLoad: function() { return Template.instance().load.get(); },

  isExpanded: function() {return selectedCat.get() === this.ctx._id; },

  curPrice: function() {
    return UserCats.findOne({cat: this.ctx._id}); },

});

Template.profileCatItem.events({
  'click [data-action="set"]': function(e, t) {
    var catId = t.data.ctx._id;
    t.load.set(true);
    Meteor.call('add cat', catId, function(err) {
      t.load.set(false);
      if (err)
        Messages.info(err.reason);
    });
  },
  'click [data-action="unset"]': function(e, t) {
    var catId = t.data.ctx._id;
    if (confirm('Удалить услугу "' + t.data.ctx.n + '"?')) {
      t.load.set(true);
      Meteor.call('rm cat', catId, function(err) {
        t.load.set(false);
        if (err)
          Messages.info(err.reason);
      });
    }
  },
  'click [data-action="expandPrice"]': function(e, t) {
    selectedCat.set(t.data.ctx._id);
  }
});

/*
 Раскрытая категория, у нас тут редактирование расценок на услуги и описание в каталоге

 {{> profileCatItemEdit ctx=ctx curPrice=curPrice}}
  где ctx - елемент категории с Categories
  curPrice - елемент UserCats для данной категории

 curPrice   -   это   оптимизация,  чтобы   избежать   сотен   вызовов
 UserCats({cat: this.ctx._id}), а так один вызов, рили быстрей

*/
Template.profileCatItemEdit.created = function() {
  var self = this,
      catId = this.data.ctx._id;
  self.loading = ReactiveVar(true);
  self.priceTemplates = ReactiveVar([]);
  self.showDetail = ReactiveVar(false);
  window.location.hash = '#' + catId; // TODO: заменить на анимацию вместо window.location.hash? и ниже также
  Meteor.call('prices of cat', catId, function(err, prices) {
    if (err)
      Messages.info(err.reason);
    else {
      self.loading.set(false);
      self.priceTemplates.set(prices);
      setupValidators( self.$('form') );
    }
  });
};

Template.profileCatItemEdit.helpers({
  isLoad: function() { return Template.instance().loading.get(); },

  // shared price template
  priceTempl: function() {      // отдаем тех кто без parent
    return _.filter( Template.instance().priceTemplates.get(),
                     function(price) {
                       return !price.p;
                     }); },
  detailPrice: function(parentPriceId) {
    if (Template.instance().showDetail.get())
      return _.filter( Template.instance().priceTemplates.get(),
                       function(price) {
                         return price.p == parentPriceId;
                       });
    else
      return false;
  },

  // текущие краткое описание
  curDesc: function() { return this.curPrice.desc; },

  // "Минимальная  сумма   заказа".  Симулируем  елемент   с  колекции
  // PriceTmp, для того чтобы использовать шаблон {{>profilePriceLine}}
  minPrice: { _id: "min",
              n: "Минимальная сумма заказа на эти виды услуг"},
  curMinPrice: function() {
    
    var userCat = UserCats.findOne({cat: this.ctx._id, u: Meteor.userId()});
    return {prices: [ {id: "min",
                       val: userCat.minSum,
                       cur: userCat.minCur}
                    ]};
  }
});

function setupValidators(jqForm) {
  // удалим старую валидацию, так как некоторые input могут быть добавлены/удалены
  // можно б и через addField/removeField, но так проще.
  // хотя и будет ощищена текущии сообщения об ошибках, ничего
  var formValidation = jqForm.data('formValidation');
  if (formValidation) {
    formValidation.destroy();
  }

  // defer - так как еще DOM не перестроилось
  Meteor.defer(function() {
      jqForm.formValidation(
        {
          fields: {
            desc: {
              validators: {
                stringLength: {
                  max: 144,
                  trim: true,
                  message: "",
                },
                notEmpty: {
                  message: "Заполните краткое описание."
                },

              }
            },
            'price_min': {
              validators: {
                numeric: {
                  message: "Должно быть число",
                },
                notEmpty: {
                  message: "Заполните цену"
                },
              }
            },
            'price': {
              selector: '[name^="price_id_"]',
              validators: {
                numeric: {
                  message: "Должно быть число",
                },
              }
            },
          }} 
      ).on('success.form.fv', function(e) {
        e.preventDefault();
      });
  });
}

Template.profileCatItemEdit.events({
  'change [name="showDetail"]': function(e, t) {
    var form = t.$('form');
    t.showDetail.set( e.currentTarget.checked );
    setupValidators(form);
  },

  'click [data-action="cancel"]': function() {
    // скрываем это окно, тоесть убираем выделеной
    selectedCat.set();
    window.location.hash = '#' + this.ctx._id;
  },
  // сохраняем прайс
  'click [data-action="save"]': function(e, t) {
    t.$('form').data('formValidation').validate();
    if (!t.$('form').data('formValidation').isValid()) {
      Messages.info('Пожалуйста исправьте ошибки');
      return false;
    }

    // this.ctx - категория
    var catId = this.ctx._id;
    var currentPrice = UserCats.findOne({cat: catId, u: Meteor.userId()});

    // минимальная цена на раздел
    var minSum = t.find('[name="price_min"]').value,
        minCur = t.find('[name="cur_min"]').value,

        description = t.find('[name="desc"]').value;
  
    // перебираем все  ценники в  шаблоне, напомню  priceTemplates это
    // массив шаблонов PriceTmp для даноого раздела.
    var prices = [],
        showDetail = t.showDetail.get();
    _.each(t.priceTemplates.get(), function(price) {
      if (price.p && !showDetail) {
        // эсли этот  прайс -  подробный, и показ  подробных отключен,
        // тогда просто  копируеем уже  сохраненный, чтобы  не удалить
        // его, так как мы его даже не редактировали.
        var p =
              // найдем этот записаный ранее price item в UserCats prices.$._id
              _.find(currentPrice.prices, function(p) {return p.id === price._id;});
        if (p)
          prices.push(p);
      } else {
        var sum = t.find('[name="price_id_'+ price._id +'"]').value,
            cur = t.find('[name="cur_'+ price._id +'"]').value;
        if (sum > 0)
          prices.push({id: price._id,
                       val: sum,
                       cur: cur});
      }
    });

    t.loading.set(true);
    Meteor.call('update cat', currentPrice._id, minCur, minSum, description, prices,
               function(err) {
                 t.loading.set(false);
                 if (err)
                   Messages.info(err.reason);
                 else {
                   // скрываем это окно, тоесть убираем выделеной
                   selectedCat.set();
                   window.location.hash = '#' + catId;
                 }
               });
  }
});

/*
 Шаблон елемента прайса
*/
Template.profilePriceLine.helpers({
  value: function() {
    var priceTmplId = this.priceTemplate._id,
        p =_.find(this.curPrice.prices,
                  function(p) {
                    return p.id === priceTmplId; });
    return p ? p.val : '';
  },
  // если шаблонный делаем либо price_min либо price_id_9999
  priceId: function() {
    var id = this.priceTemplate._id;
    if (id === 'min')
      return 'price_min';
    else
      return 'price_id_' + id;
  }
});

Template.profilePriceLine.rendered = function() {
  var self = this,
      select = self.$('select');
  select.select2({
    data: _.map(CFG.currency,    // ["грн", "руб"];
                function(item) { return {id: item, text: item};} )
  });

  // установим валюту в select2, если она определена раньше была
  var priceTmplId = this.data.priceTemplate._id,
      // ищем тот елемент в нашем UserCats.prices где id совпадает с _id шаблона
      p =_.find(this.data.curPrice.prices,
                  function(p) {
                    return p.id === priceTmplId; });
  if (p && p.cur)
    select.val(p.cur).trigger('change');
};

