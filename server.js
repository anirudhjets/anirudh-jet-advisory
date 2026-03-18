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

const MONGO_URL = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/jetapp"

mongoose.connect(MONGO_URL)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB error:", err))

// ── ADMIN PASSWORD ─────────────────────────────────────────────────────
// Change ADMIN_PASSWORD in your Railway environment variables
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "jetadmin123"

function checkAdmin(req, res, next) {
  const pwd = req.headers["x-admin-password"]
  if (pwd !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Wrong password" })
  }
  next()
}

// ── DISTANCE ───────────────────────────────────────────────────────────
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

// ── PUBLIC ROUTES ──────────────────────────────────────────────────────
app.get("/airports", (req, res) => {
  const list = []
  Object.keys(airports).forEach(code => {
    list.push({ iata: code, lat: airports[code].lat, lon: airports[code].lon })
  })
  res.json(list)
})

app.get("/mission", async (req, res) => {
  const { from, to, passengers } = req.query
  const a1 = airports[from]
  const a2 = airports[to]

  if (!a1 || !a2) return res.json({ error: "Airport not found" })

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
      if (!fuelStop) return
      stop = fuelStop
      route = `${from} → ${fuelStop} → ${to}`
    }

    const cruise = jet.cruiseSpeed || 450
    const burn = jet.fuelBurn || 400
    const flightTime = calculateFlightTime(windDistance, cruise)
    const fuelUsed = calculateFuelBurn(flightTime, burn)
    const reserveFuel = calculateReserveFuel(fuelUsed)
    const totalFuel = Math.round(fuelUsed + reserveFuel)
    const fuelPrice = fuelPrices[from] || 6.5
    const tripCost = totalFuel * fuelPrice

    results.push({
      aircraft: jet.name,
      route,
      distanceNM: Math.round(windDistance),
      flightTimeHours: Number(flightTime.toFixed(2)),
      fuelUsedGallons: Math.round(fuelUsed),
      reserveFuelGallons: Math.round(reserveFuel),
      totalFuelGallons: totalFuel,
      fuelCostUSD: Math.round(tripCost),
      fuelStop: stop
    })
  })

  res.json({ route: `${from} → ${to}`, distance: Math.round(windDistance), aircraft: results })
})

// ── ADMIN ROUTES (password protected) ─────────────────────────────────

// Get all aircraft
app.get("/admin/aircraft", checkAdmin, async (req, res) => {
  const list = await Aircraft.find({}).sort({ name: 1 })
  res.json(list)
})

// Add new aircraft
app.post("/admin/aircraft", checkAdmin, async (req, res) => {
  try {
    const jet = new Aircraft(req.body)
    await jet.save()
    res.json({ success: true, aircraft: jet })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// Update existing aircraft
app.put("/admin/aircraft/:id", checkAdmin, async (req, res) => {
  try {
    const jet = await Aircraft.findByIdAndUpdate(req.params.id, req.body, { new: true })
    res.json({ success: true, aircraft: jet })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// Delete aircraft
app.delete("/admin/aircraft/:id", checkAdmin, async (req, res) => {
  try {
    await Aircraft.findByIdAndDelete(req.params.id)
    res.json({ success: true })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// ── START ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5001
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})