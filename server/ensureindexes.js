/*

 Некоторые дополнительные индекса

*/

// основной индекс поиска юзеров в каталоге
UserCats._ensureIndex({rm: 1, cat: 1, wrkPlaces: 1, score: -1});

// не позволяем дубликаты
UserCats._ensureIndex({cat: 1, u: 1}, {unique: true});

UserCats._ensureIndex({u: 1});
