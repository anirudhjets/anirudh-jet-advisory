require("dotenv").config()
const crypto   = require("crypto")
const express  = require("express")
const mongoose = require("mongoose")
const path     = require("path")

const Aircraft   = require("./models/Aircraft")
const User       = require("./models/User")
const Client     = require("./models/Client")
const Mission    = require("./models/Mission")
const airports   = require("./utils/airportLoader")
const fuelPrices = require("./data/fuelPrices")

const { calculateFlightTime, calculateFuelBurn, adjustRangeForPayload, calculateReserveFuel, applyWind } = require("./utils/missionEngine")
const { findFuelStop } = require("./utils/fuelStopPlanner")

const app = express()
app.use(express.json())
app.use(express.static(path.join(__dirname, "public")))

const MONGO_URL = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/jetapp"
mongoose.connect(MONGO_URL)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB error:", err))

// ── SESSIONS ───────────────────────────────────────────────────────────
const sessions = new Map()

function hash(str) { return crypto.createHash("sha256").update(str).digest("hex") }

// ── MIDDLEWARE ─────────────────────────────────────────────────────────
function auth(req, res, next) {
  const session = sessions.get(req.headers["x-token"])
  if (!session) return res.status(401).json({ error: "Not logged in" })
  req.user = session
  next()
}

function adminOnly(req, res, next) {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Admin only" })
  next()
}

// ── DISTANCE ──────────────────────────────────────────────────────────
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 3440
  const dLat = (lat2-lat1)*Math.PI/180, dLon = (lon2-lon1)*Math.PI/180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

// ── LOGIN / AUTH ───────────────────────────────────────────────────────
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password) return res.status(400).json({ error: "Username and password required" })
    const user = await User.findOne({ username: username.toLowerCase().trim() })
    if (!user || hash(password) !== user.password) return res.status(401).json({ error: "Invalid username or password" })
    const token = crypto.randomBytes(32).toString("hex")
    sessions.set(token, { username: user.username, role: user.role, name: user.name })
    res.json({ token, role: user.role, name: user.name })
  } catch(e) { res.status(500).json({ error: "Login failed" }) }
})

app.post("/logout", auth, (req, res) => {
  sessions.delete(req.headers["x-token"])
  res.json({ success: true })
})

app.get("/me", auth, (req, res) => res.json(req.user))

// ── AIRPORTS ──────────────────────────────────────────────────────────
app.get("/airports", auth, (req, res) => {
  res.json(Object.keys(airports).map(code => ({ iata: code, lat: airports[code].lat, lon: airports[code].lon })))
})

// ── MISSION ───────────────────────────────────────────────────────────
app.get("/mission", auth, async (req, res) => {
  const { from, to, passengers } = req.query
  const a1 = airports[from], a2 = airports[to]
  if (!a1 || !a2) return res.json({ error: "Airport not found" })

  const baseDistance = haversineDistance(a1.lat, a1.lon, a2.lat, a2.lon)
  const windDistance = applyWind(baseDistance, a1.lon, a2.lon)
  const aircraftList = await Aircraft.find({})
  const results = []

  aircraftList.forEach(jet => {
    const pax = Number(passengers)
    const adjustedRange = adjustRangeForPayload(jet.range, pax)
    let route = `${from} → ${to}`, stop = null
    if (windDistance > adjustedRange) {
      const fuelStop = findFuelStop(from, to, airports, adjustedRange)
      if (!fuelStop) return
      stop = fuelStop
      route = `${from} → ${fuelStop} → ${to}`
    }
    const cruise = jet.cruiseSpeed || 450, burn = jet.fuelBurn || 400
    const flightTime  = calculateFlightTime(windDistance, cruise)
    const fuelUsed    = calculateFuelBurn(flightTime, burn)
    const reserveFuel = calculateReserveFuel(fuelUsed)
    const totalFuel   = Math.round(fuelUsed + reserveFuel)
    const fuelPrice   = fuelPrices[from] || 6.5
    results.push({
      aircraft: jet.name, imageUrl: jet.imageUrl || "",
      route, distanceNM: Math.round(windDistance),
      flightTimeHours: Number(flightTime.toFixed(2)),
      fuelUsedGallons: Math.round(fuelUsed),
      reserveFuelGallons: Math.round(reserveFuel),
      totalFuelGallons: totalFuel,
      fuelCostUSD: Math.round(totalFuel * fuelPrice),
      fuelStop: stop
    })
  })

  try {
    await Mission.create({ username: req.user.username, name: req.user.name, from, to, passengers: Number(passengers), distanceNM: Math.round(windDistance), aircraft: results })
  } catch(e) {}

  res.json({ route: `${from} → ${to}`, distance: Math.round(windDistance), aircraft: results })
})

// ── CLIENTS ───────────────────────────────────────────────────────────
app.get("/clients", auth, async (req, res) => {
  res.json(await Client.find({}).sort({ createdAt: -1 }))
})

app.post("/clients", auth, async (req, res) => {
  try {
    const client = await Client.create({ ...req.body, addedBy: req.user.name })
    res.json({ success: true, client })
  } catch(e) { res.status(400).json({ error: e.message }) }
})

app.delete("/clients/:id", auth, adminOnly, async (req, res) => {
  try { await Client.findByIdAndDelete(req.params.id); res.json({ success: true }) }
  catch(e) { res.status(400).json({ error: e.message }) }
})

// ── ADMIN — AIRCRAFT ──────────────────────────────────────────────────
app.get("/admin/aircraft", auth, adminOnly, async (req, res) => {
  res.json(await Aircraft.find({}).sort({ name: 1 }))
})

app.post("/admin/aircraft", auth, adminOnly, async (req, res) => {
  try { res.json({ success: true, aircraft: await Aircraft.create(req.body) }) }
  catch(e) { res.status(400).json({ error: e.message }) }
})

app.put("/admin/aircraft/:id", auth, adminOnly, async (req, res) => {
  try { res.json({ success: true, aircraft: await Aircraft.findByIdAndUpdate(req.params.id, req.body, { new: true }) }) }
  catch(e) { res.status(400).json({ error: e.message }) }
})

app.delete("/admin/aircraft/:id", auth, adminOnly, async (req, res) => {
  try { await Aircraft.findByIdAndDelete(req.params.id); res.json({ success: true }) }
  catch(e) { res.status(400).json({ error: e.message }) }
})

// ── ADMIN — USERS ─────────────────────────────────────────────────────
app.get("/admin/users", auth, adminOnly, async (req, res) => {
  res.json(await User.find({}, { password: 0 }).sort({ createdAt: -1 }))
})

app.post("/admin/users", auth, adminOnly, async (req, res) => {
  try {
    const { username, password, name, role } = req.body
    const user = await User.create({ username: username.toLowerCase().trim(), password: hash(password), name, role: role || "employee" })
    res.json({ success: true, user: { username: user.username, name: user.name, role: user.role } })
  } catch(e) {
    if (e.code === 11000) return res.status(400).json({ error: "Username already exists" })
    res.status(400).json({ error: e.message })
  }
})

app.delete("/admin/users/:id", auth, adminOnly, async (req, res) => {
  try { await User.findByIdAndDelete(req.params.id); res.json({ success: true }) }
  catch(e) { res.status(400).json({ error: e.message }) }
})

// ── ADMIN — MISSIONS ──────────────────────────────────────────────────
app.get("/admin/missions", auth, adminOnly, async (req, res) => {
  res.json(await Mission.find({}).sort({ createdAt: -1 }).limit(200))
})

// ── START ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5001
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))