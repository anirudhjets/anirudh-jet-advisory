const raw = require("airports-json")

// normalize dataset structure
let airportsData = []

if (Array.isArray(raw)) {
  airportsData = raw
} else if (raw.airports) {
  airportsData = raw.airports
} else if (raw.default) {
  airportsData = raw.default
} else {
  airportsData = Object.values(raw)
}

let airportMap = {}

airportsData.forEach(a => {

  const code =
    a.iata ||
    a.iata_code ||
    a.code ||
    a.IATA

  const lat =
    a.lat ||
    a.latitude ||
    a.latitude_deg ||
    a.latitudeDeg

  const lon =
    a.lon ||
    a.lng ||
    a.longitude ||
    a.longitude_deg ||
    a.longitudeDeg

  if (code && lat && lon) {
    airportMap[code.toUpperCase()] = {
      lat: Number(lat),
      lon: Number(lon),
      country: a.country || ""
    }
  }

})

console.log("Airports loaded:", Object.keys(airportMap).length)

module.exports = airportMap