function calculateMission(distance, aircraft, wind, passengers, fuelPrice){

const cruiseSpeed = aircraft.cruiseSpeed
const fuelBurn = aircraft.fuelBurn

const passengerWeight = 100
const baggageWeight = 20

const payload = passengers*(passengerWeight+baggageWeight)

const groundSpeed = cruiseSpeed-wind

const flightTime = distance/groundSpeed

const tripFuel = flightTime*fuelBurn

const reserveFuel = fuelBurn*0.75

const taxiFuel = 200

const totalFuel = tripFuel+reserveFuel+taxiFuel

const fuelCost = totalFuel*fuelPrice

return{

payload,
flightTime:flightTime.toFixed(2),
tripFuel:Math.round(tripFuel),
reserveFuel:Math.round(reserveFuel),
taxiFuel,
totalFuel:Math.round(totalFuel),
fuelCost:Math.round(fuelCost)

}

}

module.exports = calculateMission