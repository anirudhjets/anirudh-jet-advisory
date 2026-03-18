function charterCost(hours, rate){

return hours * rate

}

function ownershipCost(hours, fuel, crew, hangar, insurance, maintenance){

return fuel + crew + hangar + insurance + maintenance

}

module.exports={
charterCost,
ownershipCost
}