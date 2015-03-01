Template.profilePortfolio.helpers ({
  // Показываем опубликовать кнопку только если есть картинки c превью в этом портфолио
  // и не опубликовано до этого
  showPublishBtn: function () {
    return this.img &&
      this.img.length &&        // есть картинки
      this.preview &&           // есть превью
      ! this.done;              // не опубликовано до этого
  },
});

Template.profilePortfolio.events({
  'click [data-action="remove"]': function(e, t) {
    if(confirm("Удалить портфолио?")) {
      t.$('[data-action="remove"]').prop('disabled', true);
      Meteor.call('portfolio-delete', this._id, // this.id - айди портфолио
                  function(err) {
                    t.$('[data-action="remove"]').prop('disabled', false);
                    if (err) {
                      Messages.info(err.reason);
                    } else {
                      Router.go('/profile');
                      Messages.info('Портфолио удалено');
                    }
                  });
    }
  },
  'click [data-action="publish"]': function() {
    Meteor.call('portfolio-publish', this._id, function (err) {
      if (err) {
        Messages.info(err.reason);
      } else {
        Router.go('/profile');
        Messages.info('Портфолио теперь доступно другим');
      }
    });
  }
});

/*

 Вспомагательный шаблон

*/

Template.portfolioInput.rendered = function () {
  this.$('[data-toggle="popover"]').popover();
};

/*
  Заголовок
*/

Template.portfolioTitle.helpers({
  context: function() {
    var self = this;
    return {
      getter: function() { return self.title; },
      setter: function(value) {
        console.log('setter', value);
        Meteor.call('portfolio-title', self._id, value, 
                    function(err) {
                      if (err) {
                        Messages.info(err.reason);
                      }
                    });
      },
      undef: 'Заголовок не задан',
      undefIcon: 'fa fa-exclamation-triangle',
    };
  }
});

/*
  Описание профиля
*/

var editDescribe = ReactiveVar(false);

Template.portfolioDescribe.helpers({
  edit: function() { return editDescribe.get(); }  
});

Template.portfolioDescribe.events({
  'dblclick p, click [data-action="edit"]': function(e, t) {
    editDescribe.set(true);
    Meteor.defer(function() { t.$('textarea').focus(); });
  },
  'click [data-action="cancel"]': function() {
    editDescribe.set(false);
  },
  'submit form': function(e, t){
    e.preventDefault();
    Meteor.call('portfolio-describe', this._id, t.find('textarea').value, 
                function(err) {
                  editDescribe.set(false);
                  if (err) {
                    Messages.info(err.reason);
                  }
                });    
    return false;
  }
});

/*

 Загрузка фото

 */

var uploadingPhotos = ReactiveVar(),  //индикатор загрузки, количество файлов
    filesCount;                       // количество файлов для аплоада

Template.portfolioPhoto.helpers({
  uploading: function() { return uploadingPhotos.get(); },
  percent: function() {
    // 3 1 3 = 35
    // 3 2 2 = 75
    // 3 3 1 = 100
    console.log('%s perc %s', filesCount, 
                100 * (filesCount - uploadingPhotos.get() +1) / filesCount);
    return 100 * (filesCount - uploadingPhotos.get() +1) / filesCount;
  },
  moreThanOne: function() { return uploadingPhotos.get() > 1 ? true : false; }
});

function uploadFiles(files, profileId) {
  filesCount = files.length;
  _.each(files, function(file) {

    if (!file.type.match(/^image\//)) {
      Messages.info('Файл "'+ file.name + '" не является изображением.');
      return;
    }
    // не больше мегабайта
    if (file.size > 1200000) {
      Messages.info('Файл "'+ file.name + '"слишком большой');
      return;
    }
    // uploading..
    var reader = new FileReader();
    reader.onload = function(fileLoadEvent) {
      uploadingPhotos.set((uploadingPhotos.get() || 0) +1);
      Meteor.call('portfolio-upload', profileId, file.type, file.name, reader.result,
                  function(err) {
                    uploadingPhotos.set(uploadingPhotos.get()-1);
                    if (err) {
                      Messages.info(err.reason);
                    }
                  });
    };
    reader.readAsBinaryString(file);
  });
}

Template.portfolioPhoto.events({
  'click [data-action="cancel"]': function(){
    editContactName.set(false);
  },
  'dragover #dropzone': function(e, t) {
    e.preventDefault();
    e.stopPropagation();
    t.$('#dropzone').addClass('drag-over');
  },
  'dragleave #dropzone': function(e, t) {
    e.preventDefault();
    e.stopPropagation();
    t.$('#dropzone').removeClass('drag-over');
  },
  'dragenter #dropzone': function(e, t) {
    e.preventDefault();
    e.stopPropagation();
  },
  'drop #dropzone': function(e, t) {
    e.preventDefault();
    e.stopPropagation();
    t.$('#dropzone').removeClass('drag-over');
    uploadFiles(e.originalEvent.dataTransfer.files, this._id);
  },        
  'change [type="file"]': function(event, template) {
    uploadFiles(event.target.files, this._id);
  },
});

//фото

Template.portfolioPhotoItem.events({
  'click [data-action="rm"]': function(e, t) {
    if(confirm("Удалить фото?")) {
      t.$('[data-action="rm"]').prop('disabled', true);
      Meteor.call('portfolio-rm-image', Template.parentData(1)._id, this.i,
                  function(err) {
                    t.$('[data-action="rm"]').prop('disabled', false);
                    if (err) {
                      Messages.info(err.reason);
                    }
                  });
    }
  }
});

/*

 Превью фортфолио

*/

var uploadingPreview = ReactiveVar(false),
    previewRealSize,
    cropCoords,
    previewID = ReactiveVar();

Template.portfolioPreview.helpers({
  cropId: function() { return previewID.get(); },
  isLoading: function() { return uploadingPreview.get(); }
});

Template.portfolioPreview.events({
  'change [type="file"]': function(e, t) {
    var file = e.target.files[0],
        self = this;
    if (!file.type.match(/^image\//)) {
      Messages.info("Файл не является изображением");
      return;
    }
    if (file.size > 1200000) {
      Messages.info("Файл слишком большой");
      return;
    }
    var reader = new FileReader();
    reader.onload = function(fileLoadEvent) {
      uploadingPreview.set(true);
      t.$('[type="file"]').prop('disabled', true);
      Meteor.call('portfolio-upload-preview', self._id, file.type, file.name, reader.result, function(err, res){
        uploadingPreview.set(false);
        t.$('[type="file"]').prop('disabled', false);
        if (err) {
          Messages.info(err.reason);
        } else {
          previewRealSize = res.size;
          previewID.set(res.id);

          Meteor.defer(function() {
            
            var jcrop_api,
                boundx,
                boundy,
                $preview = t.$('#jcrop-preview-pane'),
                $pcnt = t.$('#jcrop-preview-pane .portfolio-preview-container'),
                $pimg = t.$('#jcrop-preview-pane .portfolio-preview-container img'),

                xsize = $pcnt.width(),
                ysize = $pcnt.height(),

                showPreview=function (c) {
                  // сохраняем координаты
                  cropCoords = c;
                  if (parseInt(c.w) > 0)
                  {
                    var rx = xsize / c.w;
                    var ry = ysize / c.h;

                    $pimg.css({
                      width: Math.round(rx * boundx) + 'px',
                      height: Math.round(ry * boundy) + 'px',
                      marginLeft: '-' + Math.round(rx * c.x) + 'px',
                      marginTop: '-' + Math.round(ry * c.y) + 'px'
                    });
                  }
                };

            t.$('#crop').Jcrop({
              onChange: showPreview,
              onSelect: showPreview,
              bgColor: 'black',
              bgOpacity: 0.6,
              bgFade: true,
              trueSize: [previewRealSize.width, previewRealSize.height],
              aspectRatio: 1.333
            },function(){
              // Use the API to get the real image size
              var bounds = this.getBounds();
              boundx = bounds[0];
              boundy = bounds[1];
              // Store the API in the jcrop_api variable
              jcrop_api = this;

              jcrop_api.animateTo([20, 20, previewRealSize.width-40, previewRealSize.height, 40]);

              // Move the preview into the jcrop container for css positioning
              $preview.appendTo(jcrop_api.ui.holder);
            });
            t.$('.modal')
              .modal('show')
              .on('hidden.bs.modal', function (){
                previewID.set(false); // это приведет к удалению формы модального окна и удалению Jcrop
              });
          });
        }
      });
    };
    reader.readAsBinaryString(file);
  },
  'click [data-action="save"]': function(e, t) {
    uploadingPreview.set(true);
    Meteor.call('portfolio-commit-preview', this._id, previewID.get(), cropCoords, function(err) {
      uploadingPreview.set(false);
      if (err) {
        Messages.info(err.reason);
        } else {
          Messages.info('Фото установлено');
          t.$('.modal').modal('hide');
        }
    });
  }
});
