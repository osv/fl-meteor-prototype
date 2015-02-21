Template.profilePortfolio.helpers ({
  // Показываем опубликовать кнопку только если есть картинки в этом портфолио
  // и не опубликовано до этого
  showPublishBtn: function () {
    return this.img && this.img.length && ! this.done;
  },
  // показываем удалить кнопку только если уже опубликовано
  showDeleteBtn: function() {
    return this.done;
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

var editTitle = new ReactiveVar(false);

Template.portfolioTitle.helpers({
  edit: function() { return editTitle.get(); },
});

Template.portfolioTitle.events({
  'click [data-action="edit"]': function(e, t) {
    editTitle.set(true);
    Meteor.defer(function() { t.$('input').focus(); });
  },
  'click [data-action="cancel"]': function() {
    editTitle.set(false);
  },
  'submit form': function(e, t){
    e.preventDefault();
    Meteor.call('portfolio-title', this._id, t.find('input').value, 
                function(err) {
                  editTitle.set(false);
                  if (err) {
                    Messages.info(err.reason);
                  }
                });    
    return false;
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

var uploadingPhotos = ReactiveVar(); //индикатор загрузки, количество файлов

Template.portfolioPhoto.helpers({
  uploading: function() { return uploadingPhotos.get(); },
  moreThanOne: function() { return uploadingPhotos.get() > 1 ? true : false; }
});

function uploadFiles(files, profileId) {
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
    uploadFiles(e.originalEvent.dataTransfer.files, this._id);
  },        
  'change [type="file"]': function(event, template) {
    uploadFiles(event.target.files, this._id);
  },
});

//фото

Template.portfolioPhotoItem.events({
  'click [data-action="rm"]': function(e, t) {
    t.$('[data-action="rm"]').prop('disabled', true);
    if(confirm("Удалить фото?"))
      Meteor.call('portfolio-rm-image', Template.parentData(1)._id, this.i,
                  function(err) {
                    t.$('[data-action="rm"]').prop('disabled', false);
                    if (err) {
                      Messages.info(err.reason);
                    }
                  });
  }
});
