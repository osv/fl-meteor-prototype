/*
 Шаблон цен категорий/разделов. чтобы юзер  мог заполнить себе
 расценки свои
*/
var priceTmplSchema = new SimpleSchema({
  cat: {
    type: String,               // к какой категории относится
  },
  n: {                          // имя ппозиции в прайсе
    type: String,
    min: 6,
    max: 128,
  },
  v: {                          // название обьема работ  по умолчанию, штук, объект, m2..
    type: String,
    min: 1,
    max: 12,
  },
  p: {                          // parent, айди отцовского
    type: String,               // Если есть, значит этот item детальный и уточняет
    optional: true               // тоесть подробный прайс
  },
  rm: {
    type: Boolean,
    optional: true
  }
});

PriceTmp = new Meteor.Collection('priceTmp');
PriceTmp.attachSchema(priceTmplSchema);

PriceTmp.deny({
  update: function(userId, post, fieldNames) {
    return (_.without(fieldNames, 'n', 'v', 'p', 'rm', 'cat').length > 0);
  }
});

PriceTmp.allow({
  update: isAdminById,
});
