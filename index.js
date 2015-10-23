/* global L */
require('mapbox.js')
var chroma = require('chroma-js')
var extent = require('turf-extent')
var fetchFootprints = require('./lib/fetch-footprints')
var grid = require('./lib/grid')

L.mapbox.accessToken = 'pk.eyJ1IjoiZGV2c2VlZCIsImEiOiJnUi1mbkVvIn0.018aLhX0Mb0tdtaT2QNe2Q'

document.addEventListener('DOMContentLoaded', function () {
  document.head.insertAdjacentHTML('beforeend', '<link href="https://api.mapbox.com/mapbox.js/v2.2.2/mapbox.css" rel="stylesheet" />')
  document.body.style.margin = 0
  document.body.style.padding = 0
  document.body.insertAdjacentHTML('beforeend', '<div id="map" style="position: absolute; top: 0; bottom: 0; width: 100%"></div>')

  var map // the leaflet map
  var tree // the spatial index structure

  // fetch footprint data and index it:
  fetchFootprints(function (err, data) {
    if (err) { throw err }
    console.log('got footprints')
    tree = data
    map = L.mapbox.map('map', 'mapbox.streets')
      .on('load', updateGrid)
      .on('moveend', updateGrid)
    map.setView([0, 180 + Math.random() * 180], 2)
  })

  var gridlayer
  function updateGrid () {
    // recompute grid based on current map view (bounds + zoom)
    var bounds = map.getBounds().toBBoxString().split(',').map(Number)
    var gridData = grid(map.getZoom(), bounds)

    // stick a 'count' property onto each grid square, based on the number of
    // footprints that intersect with the square
    console.time('aggregate on grid')
    gridData.features.forEach(function (gridSquare) {
      // the footprints with bboxes that intersect with this grid square
      var foots = tree.search(extent(gridSquare))

      // in the real browser we can add a simple step to first filter the
      // features that come out of the tree.search() based on whatever filter
      // the user has currently selected
      gridSquare.properties.count = foots.length
    })
    console.timeEnd('aggregate on grid')

    if (gridlayer) { map.removeLayer(gridlayer) }

    gridlayer = L.geoJson(gridData, {
      style: gridStyle,
      onEachFeature: function (feature, layer) {
        layer.bindPopup(JSON.stringify(feature.properties))
      }
    }).addTo(map)
  }
})

// data driven style for grid square based on the 'count' property
var scale = chroma.scale(['white', 'navy']).mode('lab').domain([0, 20])
function gridStyle (feature) {
  return {
    fillColor: scale(feature.properties.count).hex(),
    weight: 1,
    color: '#aaa'
  }
}
