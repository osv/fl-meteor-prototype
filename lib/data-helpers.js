
/*
 Convert collection data to select2 data array

 Пример:

 data = [ {_id: 1, name: "foo1"},
          {_id: 2, name: "child 1 of foo1", p: 1}
          {_id: 3, name: "child 2 of foo1", p: 1}
          {_id: 3, name: "child 2 of foo1", p: 1, rm: true} // этот елемент удален - rm: true
        ]

 console.log( col2sel(data, 'p', 'name', '_id', 'rm') );

 [{text: 'foo1', children: [
    {text: 'child 1 of foo1', id: 2}
    {text: 'child 2 of foo1', id: 3}
 ]}]


*/
col2sel = function(array, parentKey, textKey, idKey, rmKey) {

  function find(data, parent) {
    return _.chain(data)
    // филтруем по отцу
      .filter(function(item) { 
        // если елемент удаленный - пропускаем
        if (rmKey && item [rmKey])
          return false;
        // если parent false то отдаем те которые не имеют отца или отец пустой
        if (parent === false &&
            (! _.has(item, parentKey) ||
             item [parentKey] === ""))
          return true;
        else
          // иначе отдаем те чей отец - parent
          return (item[ parentKey ] == parent);
      })
    // создаем елементы для select2 с children если нужно
      .map(function(item) {
        var parentId = item [ idKey ],
            children = find(array, parentId),
            newItem = {
              text: item [ textKey ],

            };
        if (!_.isEmpty(children)) {
          newItem.children = children;
        } else {
          newItem.id = item [ idKey ];
        }
        return newItem;
      })
      .value();
  }

  // начинаем обход, сперва с тех кто без отцов (root items)
  return find(array, false);
};

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
