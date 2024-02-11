import ElementSet from './ElementSet.js';

/**
 * DOM maniulation methods
 * @template {Element} T
 * @param  {[string] | [Element, string]} args 
 * @returns {ElementSet<T>}
 */
export default function $(
  ...args
) {
  /** @type {Element} */
  const target = (
    args.length == 2 ? args.shift() : document
  );
  /** @type {string} */
  const sel = args[0];
  if (target) {
    /** @type {ReturnType<typeof target.querySelectorAll<T>>} */
    const els = target.querySelectorAll(sel);
    return ElementSet.from(els);
  } else {
    return new ElementSet();
  }
}

/**
 * Create a new DOM element
 * @template T
 * @param {string} name 
 * @param {{ [key: string]: unknown }=} atts 
 * @returns {T}
 */
$.create = function (
  name,
  atts,
) {
  const el = document.createElement(name);
  if (atts) {
    for (const k in atts) el.setAttribute(k, String(atts[k]));
  }
  return el;
};

/**
 * Find parent or self matching selector (or test function)
 * @template {Element} T
 * @param {Element} el 
 * @param {string | ((el: Element) => boolean)=} sel 
 * @returns {T | undefined}
 */
$.up = function (
  el,
  sel,
) {
  /** @type {Element | null} */
  let trace = el;
  if (typeof sel === 'string') {
    while (trace && !trace.matches(sel)) trace = trace.parentElement;
  } else if (typeof sel === 'function') {
    while (trace && !sel(trace)) trace = trace.parentElement;
  }
  return trace ? (trace) : undefined;
};

/**
 * @param  {(string | object | undefined)[]} args 
 */
export function cn(...args) {
  const classes = new Set();
  for (const arg of args) {
    if (!arg) {
      continue;
    } else if (typeof arg === 'string') {
      for (const cn of arg.split(/\s+/g)) {
        classes.add(cn);
      }
    } else if (typeof arg === 'object') {
      for (const [k, v] of Object.entries(arg)) {
        if (v) {
          classes.add(k);
        } else {
          classes.delete(k);
        }
      }
    }
  }

  return Array.from(classes).join(' ');
}
