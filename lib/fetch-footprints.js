var get = require('simple-get')
var parse = require('JSONStream').parse
var rbush = require('rbush')

/**
 * Fetch footprints from OAM catalog and index them using rbush
 *
 * @param {function} callback called with (err, tree), where tree is an rbush tree
 */
function fetch (callback) {
  console.time('fetch footprints')

  // note: currently, this is just hitting the `/meta` endpoint, getting ALL
  // the results, and then pulling out just the geojson and the properties
  // relevant for filtering
  // In reality, we should be able to significantly improve performance by
  // adding a new endpoint to the catalog that only returns this data
  get('http://api.openaerialmap.org/meta', function (err, res) {
    if (err) { return callback(err) }
    res.pipe(parseFootprints(function (err, result) {
      console.timeEnd('fetch footprints')
      console.time('index footprints')
      var tree = rbush(9)
      tree.load(result.features.map(function (feat) {
        var item = feat.geometry.bbox
        item.feature = feat
        return item
      }))
      console.timeEnd('index footprints')
      callback(err, tree)
    }))
  })
}

function parseFootprints (callback) {
  var fc = {
    type: 'FeatureCollection',
    features: []
  }
  var id = 0
  var featureStream = parse(['results', true], function (foot) {
    fc.features.push({
      type: 'Feature',
      properties: {
        gsd: foot.gsd,
        tms: !!foot.properties.tms,
        acquisition_end: foot.acquisition_end,
        FID: id++
      },
      geometry: foot.geojson
    })
  })

  featureStream.on('error', callback)
  featureStream.on('end', function () { callback(null, fc) })

  return featureStream
}

module.exports = fetch
