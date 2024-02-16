import { REGISTRY_BASE_URL } from './ModuleCache.js';
import PromiseWithResolvers from './PromiseWithResolvers.js';
import fetchJSON from './fetchJSON.js';

/** @type {Map<string, PackumentCacheEntry>()} */
const packumentCache = new Map();

/**
 * @typedef {import('./PromiseWithResolvers.js').PromiseWithResolversType<import('@npm/types').Packument | undefined> & {
 *  packument?: import('@npm/types').Packument;
 * }} PackumentCacheEntry
 */

/**
 * @param {string} moduleName
 * @returns {PackumentCacheEntry['promise']}
 */
export async function getNPMPackument(
  moduleName,
){
  let cacheEntry = packumentCache.get(moduleName);
  if (!cacheEntry) {
    /** @type {PackumentCacheEntry} */
    cacheEntry = PromiseWithResolvers();
    packumentCache.set(moduleName, cacheEntry);

    await fetchJSON(`${REGISTRY_BASE_URL}/${moduleName}`, {
      // Per
      // https://github.com/npm/registry/blob/master/docs/responses/package-metadata.md
      // we should arguably be using the 'Accept:
      // application/vnd.npm.install-v1+json' header to reduce the request size.
      // But that doesn't actually work.
      //
      // REF: https://github.com/npm/feedback/discussions/1014
      //
      // So instead we're sending 'application/json'.  The responses are smaller
      // and we get full "version" objects, so we don't have to send follow-up
      // requests.
      headers: { Accept: 'application/json' },
    })
      .catch(err => {
        console.warn(
          `Failed to fetch packument for ${moduleName}`,
          err.message,
        );
        return undefined;
      })
      .then(cacheEntry.resolve);
  }

  return cacheEntry.promise;
}

/**
 * @param {string} moduleName
 * @returns {import('@npm/types').Packument | undefined}
 */
export function getCachedPackument(moduleName){
  return packumentCache.get(moduleName)?.packument;
}

/**
 * @param {string} moduleName
 * @param {import('@npm/types').Packument} packument 
 * @returns {void}
 */
export function cachePackument(moduleName, packument) {
  let cacheEntry = packumentCache.get(moduleName);
  if (!cacheEntry) {
    /** @type {PackumentCacheEntry} */
    cacheEntry = PromiseWithResolvers();
    packumentCache.set(moduleName, cacheEntry);
    cacheEntry.resolve(packument);
  }
}
