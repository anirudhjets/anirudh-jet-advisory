function adjustForWind(distance, direction){

// simple assumption
// westbound flights take longer

if(direction === "west"){

return distance * 1.08

}

return distance * 0.95

}

module.exports = adjustForWind