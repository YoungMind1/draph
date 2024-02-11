import HttpError from './HttpError.js';
import LoadActivity from './LoadActivity.js';

/** @type {Map<string, Promise<unknown>>} */
const requestCache = new Map();

/** @type {LoadActivity} */
let activity;

/**
 * @param {LoadActivity} act 
 */
export function setActivityForRequestCache(act) {
  activity = act;
}
/**
 * @template T
 * @param {RequestInfo | URL} input
 * @param {RequestInit & { silent?: boolean, timeout?: number}=} init
 * @returns {Promise<T>}
 */
export default function fetchJSON(
  input,
  init,
) {
  const url = typeof input === 'string' ? input : input.toString();
  const cacheKey = `${url} ${JSON.stringify(init)}`;

  if (requestCache.has(cacheKey)) {
    return requestCache.get(cacheKey);
  }

  init ??= {};

  if (init.timeout) {
    if (init.signal) throw new Error('Cannot use timeout with signal');
    // Abort request after `timeout`, while also respecting user-supplied `signal`
    init.signal = AbortSignal?.timeout(init.timeout);
  }

  const traceError = new Error();

  const finish = init.silent
    ? () => {}
    : activity?.start(`Fetching ${decodeURIComponent(url)}`);

  const p = window
    .fetch(input, init)
    .then(res => {
      if (res.ok) return res.json();
      const err = new HttpError(res.status);
      err.stack = traceError.stack;
      return Promise.reject(err);
    })
    .catch(err => {
      err.message = `Failed to get ${url}`;
      return Promise.reject(err);
    })
    .finally(() => finish?.());

  requestCache.set(cacheKey, p);

  return p;
}
