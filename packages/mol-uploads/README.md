mol-uploads
-----------

Аплоад аватарок. Здеся включен также Jcrop.

Загрузки сохраняются в `.meteor/local/uploads`. Аватарки в под каталоге `av/src`, `av/thm`.

Установить каталог аплоад, можно через переменную окружения `UPLOADDIR`.

## Методы

Аплоад аватарки.

```js
meteor.call('avatar-upload', type, name, blob)
   // пример использования
   var reader = new FileReader();
   reader.onload = function(fileLoadEvent) {
     Meteor.call('avatar-upload', file.type, file.name, reader.result, function(err, res){
       // res.id - айди аплоада
       // res.size - реальны размер картинки
     });
   };
   reader.readAsBinaryString(file);

```

Загруженная картинка должна быть обрезана, указать размеры следующим методом:

```js
Meteor.call('avatar-commit',  avatarId, cropCoords, function(err, avatarId)

```

Где cropCoords = {x, y, w, h};

Удаление аватарки юзером

```js
meteor.call('avatar-remove')
```

## UI Helpers

* `avatarForCrop` - ссылка картинки, уменшенной, для обрезки
* `avatarUrlBig`
* `avatarUrlSmall`

```html
 <img src="{{avatarUrlSmall}}" >
```

## Cron

Нужно будет потом сделать чистку каталога аплоада `pending` тоесть старше чем день нужно удалить,
здесь временные картинки которые юзер задумал себе на аватарочку установить.

## Роутинг

Аватарки доступны по роуту `/i/`

И хотя есть роутинг для статики, но лучше использовать nginx чтобы не дергать метеор:

```
http {
 
  ## Snip Standard nginx config ##


  map $http_upgrade $connection_upgrade {
      default   upgrade;
      ''        close;
  }
  upstream meteor {
    server 127.0.0.1:3000;
  }


  server {
    listen 8080;


    server_name localhost;


    location ~ "^/i/" {
      root /path/to/uploads;
      access_log off;

      # кеш
      expires 5d;
      access_log off;
      add_header Pragma public;
      add_header Cache-Control "public, must-revalidate, proxy-revalidate";
    }
    
    # this is for any sockets
    location /sockjs/ {
      proxy_pass http://meteor;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection $connection_upgrade;
    }
    
    location / {
      proxy_pass http://meteor;
      # dont know if this is missing some stuff
    }
  }
}
```
