'use strict';

// ========================
// === SetUp Google Map ===
// ========================
// API sample query https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=39.9485647,-75.189752&type=restaurant&radius=500&keyword=pizza&key=AIzaSyDskz8ZnlgufD_v1aVY3-KvdA_e85DZDBk
// API sample query https://maps.googleapis.com/maps/api/place/textsearch/json?query=pizza+philadelphia&radius=500&key=AIzaSyDskz8ZnlgufD_v1aVY3-KvdA_e85DZDBk
var map;
var venues;

var googleMap = function() {
  var mapOptions = {
      center: { lat: 39.9485647, lng: -75.189752 },
      zoom: 13,
      styles: styles,
      mapTypeControl: false
  };
  var mapCanvas = document.getElementById('map');

  map = new google.maps.Map(mapCanvas, mapOptions)
  console.log('Google Maps API complete');
}

// ============================
// === SetUp FourSquare API ===
// ============================

var fourSquare = function() {
  // Variables needed for FourSquare API query
  var client_id = 'X04FYQTEYSWDMWR35D0GDYSP5XE4NQXPPQWHPUDNNZB35VNU';
  var client_secret = 'Z32RGPHJSA52MQ1PC2D4YYBWOFOQRQOVBF00FANDQHXLIVIL';
  var version = '20170101';
  var near = 'philadelphia';
  var query = 'pizza';
  var url = 'https://api.foursquare.com/v2/venues/search';

  // FourSquare API query
  var fourSquareQuery = $.ajax({
    url: url,
    dataType: 'json',
    data: {
      near: near,
      query: query,
      client_id: client_id,
      client_secret: client_secret,
      v: version
    },
    async: true,
    })
      .done(function(data){
        venues = data.response.venues;

        ko.applyBindings(new ViewModel());
      })
      .fail(function(){
        console.log('FourSquare API failed');
        fourSquareError();
      })
      .always(function(){
        console.log('FourSquare API complete');
  });
}

// =======================
// === SetUp Venues ===
// =======================

var Venue = function(map, venue) {
  var self = this;
  self.name = venue.name;
  self.lat = venue.location.lat;
  self.lng = venue.location.lng;
  self.location = {lat: self.lat, lng: self.lng};
  self.url = venue.url || 'n/a';
  self.checkins = venue.stats.checkinsCount;
  self.defaultIcon = makeMarkerIcon('D34836');
  self.hoverIcon = makeMarkerIcon('FFFF24');

  self.marker = (function() {
    var position = self.location;
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
                              '<div>' + self.name + '</div>' +
                              '<hr>' +
                              '<div>' +
                                '<strong>' + 'Url: ' + '</strong>' +
                                '<a href="'+self.url+'">' + self.url + '</a>' +
                              '<div>' +
                              '<div>' +
                                '<strong>' + "Checkins: " + '</strong>' +
                                 self.checkins +
                              '</div>' +
                           '</div>';

  self.marker.addListener('mouseover', function() {
    this.setIcon(self.hoverIcon);
  });
  self.marker.addListener('mouseout', function() {
    this.setIcon(self.defaultIcon);
  });
}

// ================================
// === SetUp Knockout ViewModel ===
// ================================

var ViewModel = function() {
  var self = this;

  self.venues = venues;
  console.log(self.venues);
  self.defaultIcon = makeMarkerIcon('D34836');
  self.selectedIcon = makeMarkerIcon('FFaa24');
  self.query = ko.observable('');
  self.processedVenues = ko.observableArray([]);

  self.infoWindow = new google.maps.InfoWindow();
  self.showAlert = ko.observable(false);


  self.venues.forEach(function(venue) {
    self.processedVenues().push(new Venue(map, venue));
  });

  self.filteredMarkers = ko.computed(function() {
    // clear markers
    self.processedVenues().forEach(function(venue){
      venue.marker.setMap(null);
    })
    // Get query and declare variable to hold array of results
    var processedQuery = self.query().toLowerCase();
    var queryResults;

    if (processedQuery === "") {
      queryResults = self.processedVenues();
    } else {
        queryResults = ko.utils.arrayFilter(self.processedVenues(),
         function(venue) {
          return venue.marker.name.toLowerCase().includes(processedQuery);
      });
    }

    queryResults.forEach(function(venue) {
      venue.marker.setMap(map);

      venue.infoWindow = self.infoWindow
      venue.marker.addListener('click', function() {
        self.selectVenue(venue);
      });
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

  self.selectVenue = function(selected_venue) {

    self.infoWindow.setContent(selected_venue.infoWindowContent);
    self.infoWindow.open(map, selected_venue.marker)
    self.infoWindow.addListener('closeclick', function() {
      selected_venue.marker.setAnimation(null);
    });

    // populateInfoWindow(selected_venue.marker, self.infoWindow)

    map.panTo(selected_venue.marker.position);
    selected_venue.marker.setAnimation(google.maps.Animation.BOUNCE);
    selected_venue.marker.setIcon(self.selectedIcon);

    self.processedVenues().forEach(function(unselected_venue) {
      if (selected_venue != unselected_venue) {
        unselected_venue.marker.setAnimation(null);
        unselected_venue.marker.setIcon(self.defaultIcon);
      }
    });
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


function fourSquareError() {
  var message = "We're sorry, the FourSquare API failed. Please reload.";
  $('.alert').toggle();
  $('.alert').html(message);
}

function mapError() {
  var message = "We're sorry, the Google Maps API failed. Please reload.";
  $('.alert').toggle();
  $('.alert').html(message);
}

// This function populates the infowindow when the marker is clicked. We'll only allow
// one infowindow which will open at the marker that is clicked, and populate based
// on that markers position.
function populateInfoWindow(marker, infowindow) {
  // Check to make sure the infowindow is not already opened on this marker.
  if (infowindow.marker != marker) {
    // Clear the infowindow content to give the streetview time to load.
    // infowindow.setContent('');
    infowindow.marker = marker;
    // Make sure the marker property is cleared if the infowindow is closed.


    infowindow.setContent(info)
    // var streetViewService = new google.maps.StreetViewService();
    // var radius = 50;
    // In case the status is OK, which means the pano was found, compute the
    // position of the streetview image, then calculate the heading, then get a
    // panorama from that and set the options
    // function getStreetView(data, status) {
    //   if (status == google.maps.StreetViewStatus.OK) {
    //     var nearStreetViewLocation = data.location.latLng;
    //     var heading = google.maps.geometry.spherical.computeHeading(
    //       nearStreetViewLocation, marker.position);
    //       infowindow.setContent('<div>' + marker.name + '</div><div id="pano"></div>');
    //       var panoramaOptions = {
    //         position: nearStreetViewLocation,
    //         pov: {
    //           heading: heading,
    //           pitch: 30
    //         }
    //       };
    //     var panorama = new google.maps.StreetViewPanorama(
    //       document.getElementById('pano'), panoramaOptions);
    //   } else {
    //     infowindow.setContent('<div>' + marker.name + '</div>' +
    //       '<div>No Street View Found</div>');
    //   }
    // }
    // Use streetview service to get the closest streetview image within
    // 50 meters of the markers position
    // streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
    // Open the infowindow on the correct marker.
    infowindow.open(map, marker);
  }
}

var app = function() {
  googleMap();
  fourSquare();
};
