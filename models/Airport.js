const mongoose = require("mongoose")

const airportSchema = new mongoose.Schema({

iata: String,

name: String,

lat: Number,

lon: Number,

runwayLength: Number,

landingFee: Number,

slotRestricted: Boolean,

fboOptions: [String],

fuelPrice: Number

})

module.exports = mongoose.model("Airport", airportSchema)