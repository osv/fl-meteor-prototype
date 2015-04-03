/*
 Эта вспомагательная колекция

 Колекция категорий/разделов, городов где оказывают услугу, а также ценников на услуги.

 Индекс  используется   сложный,  чтобы   удовлетворить  необходимость
 фильтра юзеров по городу, разделам и сортировкой по очкам:

 UserCats._ensureIndex({rm: 1, cat: 1, wrkPlaces: 1, score: -1});
 
*/

var Schema = {};

Schema.Price = new SimpleSchema({
  id: {                       // идентификатор шаблона цены
    type: String,
  },
  val: {                      // значение цены
    type: Number
  },
  cur: {
    type: String,
    allowedValues: CFG.currency
  }
});

// юзер может указать свою собственную позицию в прайсе
// Указать название(поклейка обоева), цену, валюту, название обьема работ (тонны, услуга..)
Schema.CustomPrice = new SimpleSchema({
  name: {                       // название услуги
    type: String,
  },
  val: {                        // значение цены
    type: Number
  },
  volume: {                     // обьем работ за ценц
    type: String
  },
  cur: {
    type: String,
    allowedValues: CFG.currency
  },
});

Schema.Main = new SimpleSchema({
  u: {                          // userId, кому принадлежит эта запись
    type: String,
  },

  cat: {                        // категория
    type: String,
  },
  pcat: {                       // slug, раздел к какой относится эта категория
    type: String                // Нужно для фильтров по разделам
  },

  score: {
    type: Number,
    optional: true
  },

  desc: {                       // дополнительное описание работы, аналогично dLong
    type: String,
    optional: true,
    max: 144
  },

  minSum: {                     // минимальная цена за которою стартует работать
    type: Number,
    optional: true
  },
  minCur: {                     // Валюта для минимальной цены заказа
    type: String,
    optional: true,
    allowedValues: CFG.currency
  },

  rm: {                         // удален ли
    type: Boolean,
    optional: true
  },

  wrkPlaces: {                  // списки мест где оказывает услуги
    type: [String],
    optional: true
  },

  prices: {                     // масив цен
    type: [Schema.Price],
    optional: true
  },
  cusPrices: {                  // юзерские ценники
    type: [Schema.CustomPrice],
    optional: true
  }
});

// user categories
UserCats = new Meteor.Collection('userCats');
UserCats.attachSchema(Schema.Main);
