import simplur from 'simplur';

/** @type {[number, string][]} */
const UNITS = [
  [1000, 'second'],
  [60, 'minute'],
  [60, 'hour'],
  [24, 'day'],
  [7, 'week'],
  [30 / 7, 'month'],
  [12, 'year]'],
];

/**
 * @param {Date | number} date 
 */
export function ago(date) {
  let since = Date.now() - Number(date);
  let when = 'just now';

  for (const [v, unit] of UNITS) {
    if (since < v) break;
    since /= v;

    when = simplur`${Math.floor(since)} ${unit}[|s] ago`;
  }
  return when;
}
