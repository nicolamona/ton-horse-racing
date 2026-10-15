export function isValidDemoAmount(amount) {
  return Number.isFinite(amount) && amount >= 1 && Number.isInteger(amount * 2);
}

export function calculateReward(amount, place) {
  if (!isValidDemoAmount(amount)) {
    throw new RangeError("Demo amount must be a finite number >= 1 in 0.5 increments");
  }
  if (!Number.isInteger(place) || place < 1 || place > 8) {
    throw new RangeError("Place must be an integer from 1 through 8");
  }
  const multiplier = place === 1 ? 3 : place === 2 ? 2 : place === 3 ? 0.5 : 0;
  return Math.round(amount * multiplier * 2) / 2;
}

export function calculateNet(reward, amount) {
  return Math.round((reward - amount) * 2) / 2;
}

export function completeFinishOrder(progress, finishOrder) {
  if (!Array.isArray(progress) || progress.length !== 8 ||
      progress.some(value => !Number.isFinite(value)) || !Array.isArray(finishOrder)) {
    throw new TypeError("Expected eight finite progress values and a finish-order array");
  }

  const seen = new Set();
  const completed = [];
  for (const horseIndex of finishOrder) {
    if (Number.isInteger(horseIndex) && horseIndex >= 0 && horseIndex < 8 && !seen.has(horseIndex)) {
      seen.add(horseIndex);
      completed.push(horseIndex);
    }
  }

  const remaining = progress
    .map((value, index) => ({ value, index }))
    .filter(horse => !seen.has(horse.index))
    .sort((a, b) => b.value - a.value)
    .map(horse => horse.index);

  return [...completed, ...remaining];
}
