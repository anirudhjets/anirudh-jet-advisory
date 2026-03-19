const mongoose = require("mongoose")

const clientSchema = new mongoose.Schema({
  fullName:          { type: String, required: true },
  phone:             { type: String },
  email:             { type: String },
  company:           { type: String },
  preferredAircraft: { type: String },
  typicalRoute:      { type: String },
  passengers:        { type: Number },
  budgetRange:       { type: String },
  notes:             { type: String },
  addedBy:           { type: String },
  createdAt:         { type: Date, default: Date.now }
})

module.exports = mongoose.model("Client", clientSchema)