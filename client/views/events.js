Template.events.events({
  'keypress th input': function(e, t){
    if (e.which === 13) {
      var name = t.find("#searchName").value,
          desc = t.find("#searchDescr").value,
          user = t.find("#searchUser").value,
          filters = {};
      if (name)
        filters.name = {$regex: mkRegexp(name), $options: 'i'};
      if (user)
        filters.userId = {$regex: mkRegexp(user)};
      if (desc)
        filters.description = {$regex: mkRegexp(desc), $options: 'i'};
      Paginations.eventsPages.set("filters", filters);
    }
  }
});

Template.events.rendered = function() {
  console.log(Paginations.eventsPages);
  Paginations.eventsPages.set( "filters", {} );
  Paginations.eventsPages.set( "sort", {createdAt: -1});
}

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
  $('[data-toggle=tooltip]').tooltip();
};


Template.eventsSorter.events({
  'click': function(){
    // значение this.sort указано в шаблоне например {{> eventsSorter sort="phone" label="Телефон"}}
    var sort = {};
    sort[this.sort] = Paginations.eventsPages.sort.hasOwnProperty(this.sort) ? - Paginations.eventsPages.sort[this.sort] : 1;
    Paginations.eventsPages.set("sort", sort);
  }
});

