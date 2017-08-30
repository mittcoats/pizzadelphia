

var Marker = function(data) {
  this.name = ko.observable(data.name);
  this.location = ko.observable(data.location);
  this.price_level = ko.observable(data.price_level);
  this.rating = ko.observable(data.rating);
}

var ViewModel = function() {
  var self = this;
  var map;
  var mapOptions = {
      center: { lat: 39.9485647, lng: -75.189752 },
      zoom: 13
  };
  var mapCanvas = document.getElementById('map');

  var markers = pizzerias;


  this.initMap = function() {
    map = new google.maps.Map(mapCanvas, mapOptions)
  };

  this.initMap();

  this.markerList = ko.observableArray([]);

  markers.forEach(function(marker){
    self.markerList.push(new Marker(marker));
  });
}

var app = function() {
  ko.applyBindings(new ViewModel());
};
