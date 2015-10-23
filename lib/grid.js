var tilebelt = require('tilebelt')

/**
 * Build a grid for the given zoom level, within the given bbox
 *
 * @param {number} zoom
 * @param {Array} bounds [minx, miny, maxx, maxy]
 */
function grid (zoom, bounds) {
  console.time('grid')
  // we'll use tilebelt to make pseudo-tiles at a zoom three levels higher
  // than the given zoom.  This means that for each actual map tile, there will
  // be 4^3 = 64 grid squares
  zoom += 3
  var ll = tilebelt.pointToTile(bounds[0], bounds[1], zoom)
  var ur = tilebelt.pointToTile(bounds[2], bounds[3], zoom)

  var boxes = []
  for (var x = ll[0]; x <= ur[0]; x++) {
    for (var y = ll[1]; y >= ur[1]; y--) {
      var tile = [x, y, zoom]
      var feature = {
        type: 'Feature',
        properties: {
          _quadKey: tilebelt.tileToQuadkey(tile),
          id: boxes.length,
          tile: tile.join('/')
        },
        geometry: tilebelt.tileToGeoJSON(tile)
      }
      boxes.push(feature)
    }
  }
  console.timeEnd('grid')
  return {
    type: 'FeatureCollection',
    features: boxes
  }
}

module.exports = grid
