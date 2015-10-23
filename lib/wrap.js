module.exports = function wrap (feature) {
  return {
    type: feature.type,
    properties: feature.properties,
    geometry: {
      type: feature.geometry.type,
      coordinates: [ feature.geometry.coordinates[0].map(wrapPoint) ]
    }
  }
}

function wrapPoint (pt) {
  pt = [pt[0], pt[1]]
  while (pt[0] < -180) {
    pt[0] += 360
  }

  while (pt[0] >= 180) {
    pt[0] -= 360
  }

  return pt
}
