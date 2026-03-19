require("dotenv").config()
const crypto   = require("crypto")
const mongoose = require("mongoose")
const User     = require("./models/User")

const MONGO_URL  = process.env.MONGO_URL  || "mongodb://127.0.0.1:27017/jetapp"
const ADMIN_PASS = process.env.ADMIN_PASS || "Anirudh@Jets2024"

mongoose.connect(MONGO_URL)
  .then(async () => {
    const hash = crypto.createHash("sha256").update(ADMIN_PASS).digest("hex")
    await User.findOneAndUpdate(
      { username: "anirudh" },
      { username: "anirudh", password: hash, role: "admin", name: "Anirudh" },
      { upsert: true, new: true }
    )
    console.log("Admin account ready — username: anirudh  password:", ADMIN_PASS)
    mongoose.connection.close()
  })
  .catch(err => { console.error("Failed:", err.message); process.exit(1) })