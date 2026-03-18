const mongoose = require("mongoose")

const aircraftSchema = new mongoose.Schema({

name: String,

manufacturer: String,

passengers: Number,

range: Number, // nm marketing range

cruiseSpeed: Number, // knots

fuelBurn: Number, // gallons per hour

maxPayload: Number, // kg

price: Number, // million USD

age: Number,

cabin: {
length: Number,
width: Number,
height: Number
},

interiorImages: [String],

seatLayoutImage: String,

cabinTour: String

})

module.exports = mongoose.model("Aircraft", aircraftSchema)