function calculateOperatingCost({

hours,
fuelPrice,
fuelBurn,
crew,
hangar,
insurance,
maintenance

}){

const fuelCost = hours * fuelBurn * fuelPrice

const annualCost =
fuelCost +
crew +
hangar +
insurance +
maintenance

return {

fuelCost,
annualCost,
costPerHour: annualCost / hours,
fiveYearCost: annualCost * 5

}

}

module.exports = calculateOperatingCost