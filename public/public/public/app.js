const aircraftSelect = document.getElementById("aircraftSelect");
const passengersInput = document.getElementById("passengers");

let aircraftList = [];


async function loadAircraft() {

  const res = await fetch("http://localhost:5001/api/aircraft");

  const aircraft = await res.json();

  aircraftList = aircraft;

  aircraftSelect.innerHTML = "";

  aircraft.forEach(a => {

    const option = document.createElement("option");

    option.value = a.range;

    option.textContent =
      `${a.name} (${a.passengers} pax • ${a.range} nm)`;

    aircraftSelect.appendChild(option);

  });

}

loadAircraft();


async function updateRange() {

  const range = aircraftSelect.value;

  const passengers = passengersInput.value;

  const res = await fetch("http://localhost:5001/api/calculate-range", {

    method: "POST",

    headers: {
      "Content-Type": "application/json"
    },

    body: JSON.stringify({
      range,
      passengers
    })

  });

  const data = await res.json();

  drawRange(data.operationalRange);

}