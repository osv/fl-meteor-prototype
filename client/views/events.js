Template.events.events({
  'keypress th input': function(e, t){
    if (e.which === 13) {
      var name = t.find("#searchName").value,
          desc = t.find("#searchDescr").value,
          filters = {};
      if (name)
        filters.name = {$regex: mkRegexp(name), $options: 'i'};
      if (desc)
        filters.description = {$regex: mkRegexp(desc), $options: 'i'};
      Paginations.eventsPages.set("filters", filters);
    }
  }
});

Template.eventItem.helpers({
  created: function() {
      return moment(this.createdAt).format("YYYY/MM/DD hh:mm");
  },
  fromNow: function() {
    return moment(this.createdAt).fromNow();
  },
  imp: function() {
    return this.important ? "Да" : "Нет";
  }
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

