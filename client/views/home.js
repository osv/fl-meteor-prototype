Template.home.rendered = function(){
  // рисуем QR код, в котором будет линк на сайт. В будущем, добавим для мастеров vCard в телефон
  qrcode = new QRCode(document.getElementById("qr-root"), {
    width : 64,
    height : 64,
    colorDark : "green",
    colorLight : "#ffffff",
    correctLevel : QRCode.CorrectLevel.M,
  });
  qrcode.makeCode(Meteor.absoluteUrl());

  // демка селекторов
  this.$("#demo-city-select").select2({
    dataAdapter: S2Adaptors.cities,
    placeholder: "Город, Область, Страна"
  });
  this.$("#demo-region-select").select2({
    dataAdapter: S2Adaptors.regions,
    placeholder: "Область, Страна"
  });

};
