// Percentage change vs the previous period, or null when it can't be compared
// (previous was zero but now isn't: "new" rather than an infinite jump).
export const percentChange = (current, previous) => {
  const now = Number(current) || 0;
  const before = Number(previous) || 0;
  if (before === 0) return now === 0 ? 0 : null;
  return ((now - before) / Math.abs(before)) * 100;
};
