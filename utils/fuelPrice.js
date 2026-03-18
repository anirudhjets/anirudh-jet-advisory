const prices={

US:1.0,
UK:1.35,
AE:1.05,
IN:1.15,
SG:1.25,
FR:1.35,
DE:1.32,
DEFAULT:1.20

}

function getFuelPrice(country){

return prices[country] || prices.DEFAULT

}

module.exports = getFuelPrice