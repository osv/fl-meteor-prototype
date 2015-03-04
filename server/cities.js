/*

 ФАЙЛЫ ГОРОДОВ ИЗМЕНЯТЬ НЕЛЬЗЯ БЕЗ МИГРАЦИИ БАЗЫ. ТАК КАК АЙДИШНИКИ ГОРОДОВ ГЕНЕРИРУЮТЬСЯ ИМИ ЖЕ

 Айди городов имеют такой формат: "ru/adygeya/majkop"

 Тоесть, если например Крым отдадим Украине, то нужно писать миграцию,
 заменить например с 'ru/krim/alupka' на 'ua/krim/alupka'. Потому крым сам по себе - 'qrm/krim/alupka'

 Поиск поддерживает транслитерацию, ошибочную расскладку клавиатуры: "москва", "moskva", "vjcrdf"

 Методы: get-cities, get-regions


*/

// helpers

// не изменять без миграции базы!
var transliterate = (
  function() {
    var
    rus = "щ   ш  ч  ц  ю  я  ё  ж  ъ ы э а б в г д е з и й к л м н о п р с т у ф х ь і ї  є ґ".split(/ +/g),
    eng = "shh sh ch cz yu ya yo zh ` y e a b v g d e z i j k l m n o p r s t u f x ' i yi e g".split(/ +/g);
    return function(text, engToRus) {
      if (!text)
        return "";

      var x;
      for(x = 0; x < rus.length; x++) {
	text = text.split(engToRus ? eng[x] : rus[x]).join(engToRus ? rus[x] : eng[x]);
	text = text.split(engToRus ? eng[x].toUpperCase() : rus[x].toUpperCase()).join(engToRus ? rus[x].toUpperCase() : eng[x].toUpperCase());
      }
      return text;
    };
  }
)();

// Эта функция вернет кирилицу если расскладка была английская
var translateMissKbd = (
  function() {
    var
    eng = "o i x w . z ` ; m s ' f , d u l t p b q r k v y j g h c n e a [ m s ] \\".split(/ +/g),
    rus = "щ ш ч ц ю я ё ж ъ ы э а б в г д е з и й к л м н о п р с т у ф х ь і ї ґ ".split(/ +/g);
    return function(text, engToRus) {
      if (!text)
        return "";

      var x;
      for(x = 0; x < eng.length; x++) {
	text = text.split(eng[x]).join(rus[x]);
      }
      return text;
    };
  }
)();

/*

 Читаем файлы городов, формат их таков:

 | Численность населения | Город | Область/республика | .. дополнительные данные (не используем)..
0           1                 2       3

*/
var cities = {},
    regions = {},
    citiesSearch = [],          // отсортированы по популяции
    regionsSearch = [];         // отсортированы по популяции

_.each([ { filename: 'cities-ru.org', // файл в private каталоге
           country: 'Россия',
           country_iso: 'ru'          // iso - использоваться будет в id
         },
         { filename: 'cities-ua.org',
           country: 'Україна',
           country_iso: 'ua'
         },
         { filename: 'cities-qirim.org',
           country: '',
           country_iso: 'qrm'
         }

       ], function(it) {
         var fileData = Assets.getText(it.filename);
         _.each(fileData.split("\n"),
                function (line){
                  var data = line.split("|");
                  if (!_.isUndefined (data[3])) {

                    var population = data[1].trim(),
                        city = data[2].trim(),   // город
                        region = data[3].trim(); // область

                    if (!city || !region)
                      throw new Error("File contains emprty city or region name! Check file private/" + it.filename);

                    if (population === "")
                      throw new Error("Population not defined for '" + city +"'. Check file private/" + it.filename);

                    population = parseInt(population);

                    var transCity = transliterate( city ).toLowerCase(),
                        transRegion = transliterate( region ).toLowerCase(),
                        regionId = it.country_iso + '/' + transRegion + '/',
                        cityId = regionId + transCity;

                    // +город
                    cities [cityId] = { text: city + ', ' + region + (it.country !== "" ? ", " + it.country : ""),
                                        tr: transCity, // это поле используеться для поиска
                                        population: population
                                        };

                    // +регион, аккумулируем популяцию
                    if (_.has(regions, regionId))
                      regions [ regionId ].population += population; // просто добавляем популяцию
                    else
                      regions[ regionId ] = { text: region + (it.country !== "" ? ", " + it.country : ""),
                                                    tr: transRegion, // это поле используеться для поиска
                                                    population: population                                            
                                                 };
                  }
                });
       });

for (var id in regions) {
  regionsSearch.push({
    id: id,
    tr: regions[id].tr,
    text: regions[id].text,
    population: regions[id].population,
  });
}

regionsSearch = _.sortBy(regionsSearch, function(it) { return -it.population;});

for (id in cities) {
  citiesSearch.push({
    id: id,
    tr: cities[id].tr,
    text: cities[id].text,
    population: cities[id].population,
  });
}

citiesSearch = _.sortBy(citiesSearch, function(it) { return -it.population;});

function searchCity(term, limit) {
  var trans = transliterate(term),
      num = 0,
      i = 0,
      result = [];

  for (; i< citiesSearch.length; i++) {
    if (citiesSearch[i].tr.indexOf ( trans ) === 0) {
      result.push({id: citiesSearch[i].id,
                   text: citiesSearch[i].text});

      num ++;
      if (num >= limit)          // лимит
        return result;
    }
  }
  return result;
}

function searchRegion(term, limit) {
  var trans = transliterate(term),
      i = 0,
      num = 0,
      result = [];

  for( ; i < regionsSearch.length; i++) {
    if (regionsSearch[i].tr.indexOf ( trans ) === 0) {
      result.push({id: regionsSearch[i].id,
                   text: regionsSearch[i].text});

      num ++;
      if (num >= limit)
        return result;
    }
  }
  return result;
}

Meteor.methods({
  'get-cities': function(term, limit) {
    var result = [];

    if (!term)
      term = '';

    term = term.toLowerCase().trim();

    limit |= 6;
    if (limit > 100)
      limit = 100;

    result = searchCity(term, limit);

    // Если не достаточно нашли результатов
    // а также если похоже на то что ошиблись расскладкой,
    // тогда повторим, но исправив поисковый терм translateMissKbd
    if ( result.length < limit && term.match(/^[a-z.`;',[\]\\]+$/) ) {
      result = result.concat(
        searchCity( translateMissKbd(term), limit - result.length ) );
    }

    return result;
  },
  'get-regions': function(term, limit) {
    var result = [];

    if (!term)
      term = '';

    term = term.toLowerCase().trim();

    limit |= 6;
    if (limit > 100)
      limit = 100;

    result = searchRegion(term, limit);

    if ( result.length < limit && term.match(/^[a-z.`;',[\]\\]+$/) ) {
      result = result.concat(
        searchRegion( translateMissKbd(term), limit - result.length ) );
    }

    return result;
  }
});
