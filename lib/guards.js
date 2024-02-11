/**
 * @template T
 * @param {T | undefined | null} val 
 * @returns {val is T}
 */
export function isDefined(val) {
  return val !== undefined && val != null;
}
