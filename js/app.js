// ========================
// === SetUp Google Map ===
// ========================

var map;

var googleMap = function() {
  var mapOptions = {
      center: { lat: 39.9485647, lng: -75.189752 },
      zoom: 13,
      mapTypeControl: false
  };
  var mapCanvas = document.getElementById('map');

  map = new google.maps.Map(mapCanvas, mapOptions)
}

// ======================
// === SetUp Yelp API ===
// ======================



// ========================
// === SetUp Map Makers ===
// ========================

var Marker = function(data) {
  this.name = ko.observable(data.name);
  this.location = ko.observable(data.location);
  this.price_level = ko.observable(data.price_level);
  this.rating = ko.observable(data.rating);

  // This function takes in a COLOR, and then creates a new marker
  // icon of that color. The icon will be 21 px wide by 34 high, have an origin
  // of 0, 0 and be anchored at 10, 34).
  function makeMarkerIcon(markerColor) {
    var markerImage = new google.maps.MarkerImage(
      'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|'+ markerColor +
      '|40|_|%E2%80%A2',
      new google.maps.Size(21, 34),
      new google.maps.Point(0, 0),
      new google.maps.Point(10, 34),
      new google.maps.Size(21,34));
    return markerImage;
  }
}

// ================================
// === SetUp Knockout ViewModel ===
// ================================

var ViewModel = function() {
  // Bind self to ViewModel
  var self = this;
  var locations = pizzerias;
  var largeInfowindow = new google.maps.InfoWindow();

  self.markers = ko.observableArray([]);

  locations.forEach(function(location) {
    var position = location.geometry.location;
    var name = location.name;
    var id = location.id;
    var marker = new google.maps.Marker({
      map: map,
      position: position,
      name: name,
      animation: google.maps.Animation.DROP,
      id: id
    });

    self.markers.push(marker);

    // marker.addListener('click', function() {
    //   populateInfoWindow(this, largeInfoWindow)
    // });
    // marker.addListener('mouseover', function() {
    //   this.setIcon(highlightedIcon);
    // })
    // marker.addListener('mouseout', function() {
    //   this.setIcon(defaultIcon);
    // })
  });
}

var app = function() {
  googleMap();
  ko.applyBindings(new ViewModel());
};
