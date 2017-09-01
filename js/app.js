'use strict';

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

// ======================
// === SetUp Markers ====
// ======================

// var Marker = function(data) {
//   var self = this;
//   this.name = data.name;
//   this.location = data.geometry.location;
//   this.googleRating = data.rating;
//   this.priceLeve = data.price_level;
//   this.yelpRating = '';
//   this.infoWindow = new google.maps.InfoWindow();
//   this.infoWindowContent = '<div>' +
//                              name +
//                            '</div><div id="pano"></div>';
//
//   this.infoWindow = new google.maps.InfoWindow(infoWindowContent);
// }

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


// This function populates the infowindow when the marker is clicked. We'll only allow
// one infowindow which will open at the marker that is clicked, and populate based
// on that markers position.
function populateInfoWindow(marker, infowindow) {
  // Check to make sure the infowindow is not already opened on this marker.
  if (infowindow.marker != marker) {
    // Clear the infowindow content to give the streetview time to load.
    infowindow.setContent('');
    infowindow.marker = marker;
    // Make sure the marker property is cleared if the infowindow is closed.
    infowindow.addListener('closeclick', function() {
      infowindow.marker = null;
    });
    var streetViewService = new google.maps.StreetViewService();
    var radius = 50;
    // In case the status is OK, which means the pano was found, compute the
    // position of the streetview image, then calculate the heading, then get a
    // panorama from that and set the options
    function getStreetView(data, status) {
      if (status == google.maps.StreetViewStatus.OK) {
        var nearStreetViewLocation = data.location.latLng;
        var heading = google.maps.geometry.spherical.computeHeading(
          nearStreetViewLocation, marker.position);
          infowindow.setContent('<div>' + marker.name + '</div><div id="pano"></div>');
          var panoramaOptions = {
            position: nearStreetViewLocation,
            pov: {
              heading: heading,
              pitch: 30
            }
          };
        var panorama = new google.maps.StreetViewPanorama(
          document.getElementById('pano'), panoramaOptions);
      } else {
        infowindow.setContent('<div>' + marker.name + '</div>' +
          '<div>No Street View Found</div>');
      }
    }
    // Use streetview service to get the closest streetview image within
    // 50 meters of the markers position
    streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
    // Open the infowindow on the correct marker.
    infowindow.open(map, marker);
  }
}


// ================================
// === SetUp Knockout ViewModel ===
// ================================

var ViewModel = function() {
  // Bind self to ViewModel
  var self = this;
  self.locations = pizzerias;
  self.infoWindow = new google.maps.InfoWindow();
  self.defaultIcon = makeMarkerIcon('D34836');
  self.highlightedIcon = makeMarkerIcon('FFFF24');

  self.query = ko.observable('');
  self.markers = ko.observableArray([]);

  self.locations.forEach(function(location) {
    var position = location.geometry.location;
    var name = location.name;
    var id = location.id;
    var marker = new google.maps.Marker({
      map: null,
      position: position,
      id: id,
      name: name,
      icon: self.defaultIcon,
      animation: google.maps.Animation.DROP
    });

    self.markers().push(marker);

    marker.addListener('click', function() {
      populateInfoWindow(this, infoWindow)
    });
    marker.addListener('mouseover', function() {
      this.setIcon(self.highlightedIcon);
    })
    marker.addListener('mouseout', function() {
      this.setIcon(self.defaultIcon);
    })
  });

  var filteredMarkers = ko.computed(function() {
    var processedQuery = self.query().toLowerCase();

    if (processedQuery === "") {
      return self.markers();
    } else {
        return ko.utils.arrayFilter(self.markers(), function(marker) {
          return marker.name.toLowerCase().includes(processedQuery);
      });
    }
    console.log(self.filteredMarkers);
    showMarkers();
  });

  self.showMarkers = ko.computed(function() {
    var bounds = new google.maps.LatLngBounds();
    // Extend the boundaries of the map for each marker and display the marker
    // self.locations.forEach(function(location)
    filteredMarkers.forEach(function(marker) {
      marker.setMap(map)
      bounds.extend(marker.position);
    })
    map.fitBounds(bounds);
  });
}

var app = function() {
  googleMap();
  ko.applyBindings(new ViewModel());
};
