function haversine(lat1,lon1,lat2,lon2){

const R=3440

const dLat=(lat2-lat1)*Math.PI/180
const dLon=(lon2-lon1)*Math.PI/180

const a=
Math.sin(dLat/2)**2+
Math.cos(lat1*Math.PI/180)*
Math.cos(lat2*Math.PI/180)*
Math.sin(dLon/2)**2

const c=2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))

return R*c
}

function findFuelStop(from,to,airports,range){

const start=airports[from]
const end=airports[to]

let best=null
let bestDistance=999999

Object.keys(airports).forEach(code=>{

const a=airports[code]

const d1=haversine(start.lat,start.lon,a.lat,a.lon)
const d2=haversine(a.lat,a.lon,end.lat,end.lon)

if(d1<range && d2<range){

const total=d1+d2

if(total<bestDistance){

bestDistance=total
best=code

}

}

})

return best

}

module.exports={findFuelStop}