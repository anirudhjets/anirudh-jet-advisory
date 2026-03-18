const mongoose = require("mongoose")
const Aircraft = require("./models/Aircraft")

// Reads Atlas URL from environment variable, falls back to local
const MONGO_URL = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/jetapp"

mongoose.connect(MONGO_URL)

.then(async () => {

  console.log("Connected to:", MONGO_URL.includes("atlas") || MONGO_URL.includes("mongodb+srv") ? "Atlas (cloud)" : "Local")
  console.log("Seeding aircraft data...")

  await Aircraft.deleteMany({})

  await Aircraft.insertMany([

    {
      name: "Gulfstream G650",
      price: 65,
      passengers: 16,
      range: 7000,
      age: 3,
      cruiseSpeed: 488,
      fuelBurn: 450,
      maxPayload: 6500
    },

    {
      name: "Bombardier Global 7500",
      price: 75,
      passengers: 19,
      range: 7700,
      age: 2,
      cruiseSpeed: 488,
      fuelBurn: 500,
      maxPayload: 6500
    },

    {
      name: "Dassault Falcon 8X",
      price: 58,
      passengers: 14,
      range: 6450,
      age: 4,
      cruiseSpeed: 488,
      fuelBurn: 420,
      maxPayload: 6000
    },

    {
      name: "Challenger 650",
      price: 32,
      passengers: 12,
      range: 4000,
      age: 5,
      cruiseSpeed: 459,
      fuelBurn: 370,
      maxPayload: 5000
    },

    {
      name: "Embraer Praetor 600",
      price: 21,
      passengers: 9,
      range: 4018,
      age: 2,
      cruiseSpeed: 466,
      fuelBurn: 300,
      maxPayload: 4500
    }

  ])

  console.log("Aircraft inserted successfully")
  mongoose.connection.close()

})
.catch(err => {
  console.error("Connection failed:", err.message)
  process.exit(1)
})