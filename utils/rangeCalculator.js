function calculateOperationalRange(brochureRange, passengers) {

  // default values if user leaves blank
  if (!passengers) passengers = 6;

  // 5% wind penalty
  const windPenalty = brochureRange * 0.05;

  // 5% reserve fuel buffer
  const reservePenalty = brochureRange * 0.05;

  // simple passenger payload deduction
  const payloadPenalty = passengers * 15; 

  const operationalRange =
    brochureRange - windPenalty - reservePenalty - payloadPenalty;

  return operationalRange;
}

module.exports = calculateOperationalRange;
