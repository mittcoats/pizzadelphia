

var marker = function(data) {

}




var ViewModel = function() {
  var self = this;
  var map;
  var mapOptions = {
      center: { lat: 39.9485647, lng: -75.189752 },
      zoom: 13
  };
  var mapCanvas = document.getElementById('map');

  var markers = [];


  this.initMap = function() {
    map = new google.maps.Map(mapCanvas, mapOptions)
  };

  this.initMap();
}

var app = function() {
  ko.applyBindings(new ViewModel());
};
