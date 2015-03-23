Meteor.publish('cats', function() {
  var options = {};

  // если админ то показываем и удаленные категории
  if (! isAdminById(this.userId))
    options = {rm: {$ne: true }};

  return Categories.find(options);
});

/* только админам даем все цены*/
Meteor.publish('priceTmpAll', function() {
  return isAdminById(this.userId) ? PriceTmp.find() : [];
});

function categoryId() {
  return '' + incrementCounter('counters', 'category');
}

function priceId() {
  return '' + incrementCounter('counters', 'pricetmp');
}

function traversePrices(lines, category) {

}
function importCategory(text) {
  var rePrice = /^\s*([-+])(.*)/,
      reCategory = /^\s*([*]+)\s*([^\s].*)/;

  var lines = text.split("\n"),
      parentCatId,
      parentPriceId,
      cat4Price,
      line;

  while(!_.isUndefined( line = lines.shift() )) {
    var s;
    // is category, *
    if ((s = line.match(reCategory))) {
      var lvl = s[1].length,
          category = s[2];

      parentPriceId = undefined;
      cat4Price = undefined;

      if (lvl > 2)
        throw new Meteor.Error(401, 'Supported only * or ** for category. Category: ' + category);

      var id = categoryId();
      if (lvl === 1) {
        Categories.insert({_id: id, n: category});
        parentCatId = id;    // теперь это парент
        console.log('insertRoot', id, category);
      } else {
        Categories.insert({_id: id, n: category, p: parentCatId});
        console.log('insert', id, category, parentCatId);
        cat4Price = id;
      }

      // is price?
    } else if ((s = line.match(rePrice))) {
      if (!cat4Price)
        throw new Meteor.Error(401, 'Price defined, but no category before declared!');

      var priceName = s[2],
          volume,
          newPriceId = priceId();

      // split by |, get name and volume
      if (/(.*?)\|(.*)/.exec(priceName)) {
        priceName = RegExp.$1;
        volume = RegExp.$2;
      } else {
        throw new Meteor.Error(401, 'Price "' + priceName + '" have no volume!');
      }

      if (s[1] === '-') {
        parentPriceId = PriceTmp.insert({cat: cat4Price, n: priceName, v: volume, _id: newPriceId});
      } else {
        if (!parentPriceId)
          throw new Meteor.Error(401, 'Parent price not defined. ' + priceName);

        PriceTmp.insert({cat: cat4Price, n: priceName, v: volume, p: parentPriceId, _id: newPriceId});
      }
    } // if
  } // while
}

Meteor.methods({
  'import-cats': function(text) {
    check(text, String);

    if (!isAdmin())
      throw new Meteor.Error(401, 'You are not admin');

    if (!CFG.INIT_MODE)
      throw new Meteor.Error(500, 'Init mode not enabled in config.js');

    console.log(text);
    importCategory(text);
  }
});
