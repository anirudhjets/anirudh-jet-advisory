function calculateFlightTime(distanceNM, speed) {
    return distanceNM / speed
}

function calculateFuelBurn(time, burnRate) {
    return time * burnRate
}

function adjustRangeForPayload(range, passengers) {

    const avgPassengerWeight = 100
    const payload = passengers * avgPassengerWeight

    const penalty = payload * 0.02

    return range - penalty
}

function calculateReserveFuel(fuelUsed) {
    return fuelUsed * 0.45
}

function applyWind(distance, fromLon, toLon) {

    let windFactor = 1

    if (toLon > fromLon) {

        windFactor = 0.92

    } else {

        windFactor = 1.08

    }

    return distance * windFactor
}

module.exports = {
    calculateFlightTime,
    calculateFuelBurn,
    adjustRangeForPayload,
    calculateReserveFuel,
    applyWind
}