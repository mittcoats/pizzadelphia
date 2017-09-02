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

// =======================
// === SetUp Locations ===
// =======================

var Location = function(map, google_data, yelp_data) {
  var self = this;
  self.name = google_data.name;
  self.location = google_data.geometry.location;
  self.googleRating = google_data.rating;
  self.priceLeve = google_data.price_level;
  self.yelpRating = '';

  self.defaultIcon = makeMarkerIcon('D34836');
  self.highlightedIcon = makeMarkerIcon('FFFF24');

  self.marker = (function() {
    var position = self.location
    var name = self.name;
    var marker = new google.maps.Marker({
      map: null,
      position: position,
      name: name,
      icon: self.defaultIcon,
      animation: google.maps.Animation.DROP
    });
    return marker;
  })(self);

  self.infoWindowContent = '<div>' +
                             name +
                           '</div><div id="pano"></div>';

  self.infoWindow = new google.maps.InfoWindow(self.infoWindowContent);

  self.marker.addListener('click', function() {
    populateInfoWindow(this, self.infoWindow)
  });
  self.marker.addListener('mouseover', function() {
    this.setIcon(self.highlightedIcon);
  })
  self.marker.addListener('mouseout', function() {
    this.setIcon(self.defaultIcon);
  })


}

// ================================
// === SetUp Knockout ViewModel ===
// ================================

var ViewModel = function() {
  // Bind self to ViewModel
  var self = this;
  self.google_locations = pizzerias;

  self.query = ko.observable('');
  self.locations = ko.observableArray([]);

  self.google_locations.forEach(function(google_location) {
    self.locations().push(new Location(map, google_location));
  });

  self.filteredMarkers = ko.computed(function() {
    // clear markers
    self.locations().forEach(function(location){
      location.marker.setMap(null);
    })
    // Get query and declare variable to hold array of results
    var processedQuery = self.query().toLowerCase();
    var queryResults;

    if (processedQuery === "") {
      queryResults = self.locations();
    } else {
        queryResults = ko.utils.arrayFilter(self.locations(),
         function(location) {
          return location.marker.name.toLowerCase().includes(processedQuery);
      });
    }

    queryResults.forEach(function(location) {
      location.marker.setMap(map);
    });

    return queryResults;
  });

  // self.showMarkers = ko.computed(function() {
  //   var bounds = new google.maps.LatLngBounds();
  //   // Extend the boundaries of the map for each marker and display the marker
  //   self.filteredMarkers.forEach(function(marker) {
  //     marker.setMap(map)
  //     bounds.extend(marker.position);
  //   })
  //   map.fitBounds(bounds);
  // });

  self.selectMarker = function(marker) {
  };
}

// ========================
// === Helper Functions ===
// ========================

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

var app = function() {
  googleMap();
  ko.applyBindings(new ViewModel());
};
