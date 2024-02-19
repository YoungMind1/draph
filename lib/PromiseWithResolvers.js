/**
 * @typedef {{
 * promise: Promise<T>;
 * resolve: (value: T | Promise<T>) => void;
 * reject: (reason?: unknown) => void;
 * }} PromiseWithResolversType
 */

 /**
 * 
 * @template T
 */
export default function() {
  /** @type {(value: T | Promise<T>) => void} */
  let resolve;
  /** @type {(reason?: unknown) -> void} */
  let reject;
  /** @type {Promise<T>} */
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return {promise, resolve, reject};
}