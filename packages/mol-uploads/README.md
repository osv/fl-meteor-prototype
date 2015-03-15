mol-uploads
-----------

Аплоад аватарок, и картинок для портфолио. Здеся включен также Jcrop.

Некоторая идеи взяты с пакета bengott:avatar, например `{{>avatar}}` но без реактивности.

Загрузки сохраняются в `.meteor/local/uploads`. Аватарки в под каталоге `av/src`, `av/thm` и тд.

Установить каталог аплоад, можно через переменную окружения `UPLOADDIR`.

## UI Helpers

* `{{>avatarForCrop imgId }}` - ссылка картинки, уменшенной, для обрезки (400x400)

В html чтобы добавить аватарку:

```handlebars
{{> avatar (user=<user> || userId=<userId>)
           (size="large" || "small" || "extra-small")
           (shape="rounded" || "circle")
           (class="some custom classes")
           (avDef="/img/defaultAvatar.png")
           (bgColor="<color>") (txtColor="<color>") }}
```

Параметры:

  - `user` или `userId`: обьект юзера.
  Собственно аватарка будет взята с user.profile.avatar или инициалы user.profile.completeName
  - `size`: Размер  "large" (80px), "small" (30px), or "extra-small" (20px), или 200 если не задано
  - `class`: дополнительный клас
  - `avDef`: Аватарка по умолчанию, если нет, то будут инициалы
  
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
cropCoords = {x: 0, y:0, w: 100, h:100}
Meteor.call('avatar-commit',  avatarId, cropCoords, function(err, avatarId)

```

Удаление аватарки юзером

```js
meteor.call('avatar-remove')
```

Аплоад портфолио картинки `portfolio-upload`

Удаление - `portfolio-rm-image`

Удаить все картинки в портфолио - `portfolio-rm-uploads`

Загрузить превью для портфолио и получить размер и айди как в `avatar-upload` - `portfolio-upload-preview`

Обрезать превью и сохранить `portfolio-commit-preview` примерно как в `avatar-commit`

## Размеры

Аватарки:
* 200x200 - /i/av/src .. .jpg
* 80x200 - /i/av/thm .. .png
* 30x200 - /i/av/soc .. .png

Портфолио. С размерами еще не определился но пока что:
* `{{>portfolioURLsmall '123'}}` - 800x600 /i/p/thm/ .. .jpg
* `{{>portfolioURLbig '123'}}` - 300x200 /i/p/src/ .. .jpg
* `{{>portfolioURLorig '123'}}` - оригинал /i/p/org/ .. jpg
* `{{>portfolioUrlImgPreview '123'}}` - 200x150 /i/p/pre/ .. .jpg превью дляпортфолио картинки
(в колекции `portfolioSchema.Portfolio.preview`)
  
## Cron

Нужно будет потом сделать чистку каталога аплоада `pending` тоесть старше чем день нужно удалить,
здесь лежат временные картинки которые юзер задумал себе на аватарочку установить.

## Роутинг

Аватарки доступны по роуту `/i/`

И хотя есть роутинг для статики, но лучше использовать nginx чтобы не дергать метеор:

```
server {
     listen       8081;
     server_name  localhost;

    location / {
        root /webapp/moldavan/public/;
        passenger_enabled on;
        passenger_sticky_sessions on;
        passenger_env_var  MONGO_URL mongodb://localhost:27017/moldavan;
        passenger_env_var  ROOT_URL http://www.foo.com;
        passenger_env_var  UPLOADDIR /webapp/moldavan/uploads/;
        # Set these ONLY if your app is a Meteor bundle!
        passenger_app_type node;
        passenger_startup_file main.js;

        gzip            on;
        gzip_min_length 1000;

        # ошибки, в продакш нужно отключить!
        passenger_friendly_error_pages on;

        passenger_min_instances 2;
        passenger_nodejs /usr/bin/node;

        # passenger_env_var _PASSENGER_NODE_CONTROL_SERVER 1;
    }

    location /i/ {
        autoindex on;
        charset utf-8;
        allow all;
        expires 5d;
        access_log off;
        add_header Pragma public;
        add_header Cache-Control "public, must-revalidate, proxy-revalidate";
        alias /webapp/moldavan/uploads/;
    }

}

```

## Безопасность

Навсякий случай есть ограничение (`limitUploads`) на аплоад 300 картинок в день для юзера.
