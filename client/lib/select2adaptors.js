/*

 dataAdapter для select2.

 Пока адапторы: Города, регионы.

 Пример использования:

  $("#demo-city-select").select2({
    dataAdapter: S2Adaptors.cities,
    placeholder: "Город, Область, Страна"
  });


*/

S2Adaptors = {};

Meteor.startup(function(){

  function fetchCities($element, options) {
    fetchCities.__super__.constructor.call(this, $element, options);
  }

  function fetchRegions($element, options) {
    fetchRegions.__super__.constructor.call(this, $element, options);
  }

  $.fn.select2.amd.require(
    ['select2/data/array', 'select2/utils'],
    function (ArrayData, Utils) {

      // cities
      Utils.Extend(fetchCities, ArrayData);

      fetchCities.prototype.query = function (params, callback) {

        function request () {
          Meteor.call('get-cities', params.term, function(err, results) {
            callback({results: results});
          });
        }
        if (this._qT) {
          Meteor.clearTimeout(this._qT);
        }
        this._qT = Meteor.setTimeout(request, 250);
      };

      // regions
      Utils.Extend(fetchRegions, ArrayData);

      fetchRegions.prototype.query = function (params, callback) {

        function request () {
          Meteor.call('get-regions', params.term, function(err, results) {
            callback({results: results});
          });
        }

        if (this._qT) {
          Meteor.clearTimeout(this._qT);
        }
        this._qT = Meteor.setTimeout(request, 250);
      };

    });

  S2Adaptors = { 
    cities: fetchCities,
    regions: fetchRegions
  };
});
