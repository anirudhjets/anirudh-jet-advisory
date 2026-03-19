const mongoose = require("mongoose")

const missionSchema = new mongoose.Schema({
  username:   { type: String, required: true },
  name:       { type: String },
  from:       { type: String, required: true },
  to:         { type: String, required: true },
  passengers: { type: Number },
  distanceNM: { type: Number },
  aircraft:   { type: Array },
  createdAt:  { type: Date, default: Date.now }
})

module.exports = mongoose.model("Mission", missionSchema)