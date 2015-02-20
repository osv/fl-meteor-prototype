/*

 Два вида картинок:

 1. портфолио portfolioSchema.Images.
   Оригинал, и миниатюрки с одинаковым айди
 2. миниатюрка для проекта. portfolioSchema.Portfolio.preview
   она же создается с первой картинки портфолио или может быть загружена отдельно, как на oDesk

 Идентификаторы картинок - число-строка, например '123455'
   которая будет преоброзована в путь в зависимости, миниатюрка или нет. Например в '/proj/thumbs/1/2/123455'.
   /1/2/ - чтобы не перегружать каталоги и не сбивать все в кучу. 
 
 */

var portfolioSchema = {};

portfolioSchema.Images = new SimpleSchema ({
  i: {                          // идентификатор картинки
    type: String
  },
  // desc: {                       // описание картинки
  //   type: String,
  //   optional: true
  // },
});

// image portfolio
portfolioSchema.Portfolio = new SimpleSchema({
  userId: {
    type: String,
  },
  // published?
  done: {                       // опубликован ли?
    type: Boolean,
  },
  title: {                      // название проекта 
    type: String,
    optional: true,
  },
  desc: {                       // описание проекта
    type: String,
    optional: true,
  },
  preview: {                    // id картинки проекта
    type: String,
    optional: true
  },
  img: {
    type: [portfolioSchema.Images],
    optional: true
  }
});

Portfolio = new Meteor.Collection('portfolio');
Portfolio.attachSchema(portfolioSchema.Portfolio);

