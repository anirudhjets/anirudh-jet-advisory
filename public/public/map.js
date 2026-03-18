const map = L.map('map').setView([19.0760, 72.8777], 4);

L.tileLayer(
'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
{
  attribution: '© OpenStreetMap'
}
).addTo(map);

let rangeCircle;

function drawRange(range){

  const meters = range * 1852;

  if(rangeCircle){
    map.removeLayer(rangeCircle);
  }

  rangeCircle = L.circle(
    [19.0760,72.8777],
    {
      radius: meters,
      color: "blue",
      fillOpacity: 0.2
    }
  ).addTo(map);

}