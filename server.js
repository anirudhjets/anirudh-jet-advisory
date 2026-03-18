require("dotenv").config()

const express = require("express")
const mongoose = require("mongoose")
const path = require("path")

const Aircraft = require("./models/Aircraft")
const airports = require("./utils/airportLoader")
const fuelPrices = require("./data/fuelPrices")

const {
  calculateFlightTime,
  calculateFuelBurn,
  adjustRangeForPayload,
  calculateReserveFuel,
  applyWind
} = require("./utils/missionEngine")

const { findFuelStop } = require("./utils/fuelStopPlanner")

const app = express()

app.use(express.json())
app.use(express.static(path.join(__dirname, "public")))

// Uses Atlas URL in production (Railway), local MongoDB on your Mac
const MONGO_URL = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/jetapp"

mongoose.connect(MONGO_URL)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB error:", err))

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 3440
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

app.get("/airports", (req, res) => {
  const list = []
  Object.keys(airports).forEach(code => {
    list.push({
      iata: code,
      lat: airports[code].lat,
      lon: airports[code].lon
    })
  })
  res.json(list)
})

app.get("/mission", async (req, res) => {
  const { from, to, passengers } = req.query

  const a1 = airports[from]
  const a2 = airports[to]

  if (!a1 || !a2) {
    return res.json({ error: "Airport not found. Check the IATA code." })
  }

  const baseDistance = haversineDistance(a1.lat, a1.lon, a2.lat, a2.lon)
  const windDistance = applyWind(baseDistance, a1.lon, a2.lon)

  const aircraftList = await Aircraft.find({})
  const results = []

  aircraftList.forEach(jet => {
    const pax = Number(passengers)
    const adjustedRange = adjustRangeForPayload(jet.range, pax)

    let route = `${from} → ${to}`
    let stop = null

    if (windDistance > adjustedRange) {
      const fuelStop = findFuelStop(from, to, airports, adjustedRange)
      if (!fuelStop) return   // skip this aircraft if no fuel stop exists
      stop = fuelStop
      route = `${from} → ${fuelStop} → ${to}`
    }

    const cruise = jet.cruiseSpeed || 450
    const burn   = jet.fuelBurn   || 400

    const flightTime   = calculateFlightTime(windDistance, cruise)
    const fuelUsed     = calculateFuelBurn(flightTime, burn)
    const reserveFuel  = calculateReserveFuel(fuelUsed)
    const totalFuel    = Math.round(fuelUsed + reserveFuel)  // FIXED: reserve now included
    const fuelPrice    = fuelPrices[from] || 6.5
    const tripCost     = totalFuel * fuelPrice               // cost based on total fuel with reserve

    results.push({
      aircraft:        jet.name,
      route:           route,
      distanceNM:      Math.round(windDistance),
      flightTimeHours: Number(flightTime.toFixed(2)),
      fuelUsedGallons: Math.round(fuelUsed),
      reserveFuelGallons: Math.round(reserveFuel),
      totalFuelGallons: totalFuel,
      fuelCostUSD:     Math.round(tripCost),
      fuelStop:        stop
    })
  })

  res.json({
    route:    `${from} → ${to}`,
    distance: Math.round(windDistance),
    aircraft: results
  })
})

const PORT = process.env.PORT || 5001
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})