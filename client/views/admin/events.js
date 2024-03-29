Template.events.events({
  'click #refresh': function (){
    // отправляем ентер в инпут и таким образом обновляем
    var keyVal = 13;
    $('#searchUser').val(this.userId).trigger({
      type: 'keypress', keyCode: keyVal, which: keyVal, charCode: keyVal });
  },
  'keypress th input': function(e, t){
    if (e.which === 13) {
      var name = t.find("#searchName").value,
          desc = t.find("#searchDescr").value,
          user = t.find("#searchUser").value,
          ev_filer = [],        // фильтрация по нажатым checkbox
          filters = {};

      if (t.find("#ev_boot").checked)
        ev_filer.push(Events.EV_BOOT);
      if (t.find("#ev_userlogin").checked)
        ev_filer.push(Events.EV_USERLOGIN);
      if (t.find("#ev_userprofile").checked)
        ev_filer.push(Events.EV_PROFILE);
      if (!_.isEmpty(ev_filer))
        filters.type = {$in: ev_filer};

      if (name)
        filters.name = {$regex: mkRegexp(name), $options: 'i'};
      if (user)
        filters.userId = {$regex: mkRegexp(user)};
      if (desc)
        filters.desc = {$regex: mkRegexp(desc), $options: 'i'};
      filters.createdAt = {$lt: new Date()};
      Paginations.eventsPages.set("filters", filters);
    }
  }
});

Template.events.rendered = function() {
  Paginations.eventsPages.set( "filters", {createdAt: {$lt: new Date()}} );
  Paginations.eventsPages.set( "sort", {createdAt: -1});
};

Template.eventItem.helpers({
  created: function() {
      return moment(this.createdAt).format("YYYY/MM/DD hh:mm");
  },
  fromNow: function() {
    return moment(this.createdAt).fromNow();
  },
  imp: function() {
    return this.important ? "Да" : "Нет";
  },
  shortId: function() {
    return this.userId ? this.userId.substr(0, 8) : '';
  },
  typeName: function(){
    switch (this.type) {
      case Events.EV_BOOT: return "Boot";
      case Events.EV_USERLOGIN: return "Login";
      case Events.EV_PROFILE: return "Profile";
      case Events.EV_SECURITY: return "Security";
      default: return "-";
    }
  },
  class: function() {
    switch (this.type) {
    case Events.EV_BOOT: return "warning";
      //case Events.EV_USERLOGIN: return "";
    case Events.EV_PROFILE: return "info";
    case Events.EV_SECURITY: return "danger";
    }
  }
});

Template.eventItem.events({
  'click .filter-by-user': function (e, t) {
    // при клике по ссылке юзер айди, вставляем айди в инпут
    // и посылаем keypress сигнал enter. Так мы вызовим 'keypress th input' в Template.events.events
    var keyVal = 13;
    $('#searchUser').val(this.userId).trigger({
      type: 'keypress', keyCode: keyVal, which: keyVal, charCode: keyVal });
  },
});

Template.eventItem.rendered = function() {
  //initialize tooltip
  $('[data-toggle=tooltip]').tooltip({delay: {show: 300, hide: 0}});
};


Template.eventsSorter.events({
  'click': function(){
    // значение this.sort указано в шаблоне например {{> eventsSorter sort="phone" label="Телефон"}}
    var sort = {};
    sort[this.sort] = Paginations.eventsPages.sort.hasOwnProperty(this.sort) ? - Paginations.eventsPages.sort[this.sort] : 1;
    Paginations.eventsPages.set("sort", sort);
  }
});

