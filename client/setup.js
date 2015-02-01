// кастомизация менюшки дропдавн
Accounts.addDropMenus([{text: 'Ваш профиль', icon: 'fa fa-cogs', url: '/profile', id: 'profile'},
                      ]);

/* 
 Всегда подписываемся на текущего юзера.
 К содалению пакет accounts-base публикует токо [username profile]
 а нам нужно шоп и другие поля, например isAdmin и т.д.
*/
Meteor.subscribe("currentUser");
