/** @type {[number, string][]} */
const UNITS = [
  [6, 'E'],
  [5, 'P'],
  [4, 'T'],
  [3, 'G'],
  [2, 'M'],
  [1, 'k'],
  [0, ''],
  [-1, 'm'],
  [-2, '\xb5'],
  [-3, 'n'],
  [-4, 'p'],
  [-5, 'f'],
  [-6, 'a'],
];

/**
 * @param {number} v
 */
export default function human(v, suffix = '', sig = 0) {
  const base = suffix == 'B' ? 1024 : 1000;
  const { pow, log10, floor, round } = Math;
  let exp = floor(log10(v) / log10(base));
  const unit = UNITS.find(([n]) => n <= exp);

  if (!unit) return `0${suffix}`;

  v /= pow(base, unit[0]);
  exp = floor(log10(v)) + 1;
  v = exp < sig ? round(v * pow(10, sig - exp)) / pow(10, sig - exp) : round(v);

  return `${v}${unit[1]}${suffix}`;
}
