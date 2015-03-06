
/*

 Underscore mixins

 TODO: tests

*/
_.mixin({
  /*

   pluckChildrenId

   Ищет в  массиве обжектов  значение ключей "id",  а также  в массиве
   ключа children. Годится для получения списка id с данных для для select2

   var data = [
     {id: 'id1', text: 'text1'},
     {
        text: 'text1',
        children: [ {id: 'id2', text: 'text2'}, {id: 'id3', text: 'text3'},
     ]},
     {id: 'id4', text: 'text4'},
   ];

   console.log( _.pluckChildrenId(data) ); // -> [ 'id1', 'id2', 'id3', 'id4' ]
   
   
   */
  pluckChildrenId: function(data) {
    return _.chain(data)
      .map(function(item) {
        return [ item.id,
                 _.pluck(item.children, 'id')]; })
      .flatten()
      .compact()
      .value();
  },

  /*

   findDeep
   
   Перебирает обекты, возвращает тот где нашло обжект @attrs

   var data = [
     {id: 'id1', text: 'text1'},
     {
        text: 'text1',
        children: [ {id: 'id2', text: 'text2'}, {id: 'id3', text: 'text3'},
     ]},
     {id: 'id4', text: 'text4'},
   ];

   console.log( _.findDeep(data), {id: 'id2'} ); // -> {id: 'id2', text: 'text2'}

   */
  findDeep: function(items, attrs) {
    // make sure key value defined
    for (var key in attrs) {
      if (_.isUndefined(attrs[key]))
        return;
    }

    function match(value) {
      for (var key in attrs) {
        if(!_.isUndefined(value)) {
          if (attrs[key] !== value[key]) {
            return false;
          }
        }
      }

      return true;
    }

    var result;
    function traverse(value) {
      _.find(value, function (val) {
        if (match(val)) {
          result = val;
          return true;
        }

        if (_.isObject(val) || _.isArray(val)) {
          return traverse(val);
        }
        return false;
      });

      return false;
    }

    traverse(items);

    return result;
  }
});
