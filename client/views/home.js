Template.home.rendered = function(){
  // рисуем QR код, в котором будет линк на сайт. В будущем, добавим для мастеров vCard в телефон
  qr.canvas({ canvas: document.getElementById('qr-root'),
              value: Meteor.absoluteUrl(),
              size: 6,
              foreground: "green"});
};
