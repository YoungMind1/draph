import semverGt from 'semver/functions/gt.js';
import semverSatisfies from 'semver/functions/satisfies.js';
import HttpError from './HttpError.js';
import Module from './Module.js';
import {
  cachePackument,
  getCachedPackument,
  getNPMPackument,
} from './PackumentCache.js';
import PromiseWithResolvers from './PromiseWithResolvers.js';
import URLPlus from './URLPlus.js';
import { PARAM_PACKAGES } from './constants.js';
import fetchJSON from './fetchJSON.js';
import { flash } from './flash.js';
import {
  getModuleKey,
  isHttpModule,
  parseModuleKey,
  resolveModule,
} from './module_util.js';

export const REGISTRY_BASE_URL = 'https://registry.npmjs.org';

/** @type {Map<string, ModuleCacheEntry>} */
const moduleCache = new Map();

/**
 * @typedef {'exact' | 'name' | 'license' | 'maintainer'} QueryType
 */

/**
 * @typedef {import('./PromiseWithResolvers.js').PromiseWithResolversType<Module> & {
 * module?: Module; // Set once module is loaded
 * }} ModuleCacheEntry
 */

/**
 * @param {import('@npm/types').Packument} packument
 * @param {string} targetVersion
 * @returns {import('@npm/types').PackumentVersion | undefined}
 */
function selectVersion(
  packument,
  targetVersion = 'latest',
) {
  /** @type {string | undefined} */
  let selectedVersion;

  // If version matches a dist-tag (e.g. "latest", "best", etc), use that
  const distVersion = packument['dist-tags']?.[targetVersion];
  if (distVersion) {
    selectedVersion = distVersion;
  } else {
    // Find highest matching version
    for (const version of Object.keys(packument.versions)) {
      if (!semverSatisfies(version, targetVersion)) continue;
      if (!selectedVersion || semverGt(version, selectedVersion)) {
        selectedVersion = version;
      }
    }
  }

  return packument.versions[selectedVersion ?? ''];
}

/**
 * @param {string} moduleName
 * @param {string=} version
 * @returns {Promise<Module>}
 */
async function fetchModuleFromNPM(
  moduleName,
  version,
){
  const packument = await getNPMPackument(moduleName);

  if (!packument) {
    throw new Error(`Could not find ${moduleName} module`);
  }

  // Match best version from manifest
  const packumentVersion = packument && selectVersion(packument, version);

  if (!packumentVersion) {
    throw new Error(`${moduleName} does not have a version ${version}`);
  }

  return new Module(packumentVersion, packument);
}

/**
 * @param {string} urlString
 */
async function fetchModuleFromURL(urlString) {
  const url = new URL(urlString);

  // TODO: We should probably be fetching github content via their REST API, but
  // that makes this code much more github-specific.  So, for now, we just do
  // some URL-messaging to pull from the "raw" URL
  if (/\.?github.com$/.test(url.host)) {
    url.host = 'raw.githubusercontent.com';
    url.pathname = url.pathname.replace('/blob', '');
  }
  /** @type {import('@npm/types').PackageJson} */
  const pkg = await fetchJSON(url);

  if (!pkg.name) pkg.name = url.toString();

  return new Module(pkg);
}


/**
 * Note: This method should not throw!  Errors should be returned as part of a
 * stub module
 * @param {string} moduleKey
 * @returns {Promise<Module>}
 */
export async function getModule(moduleKey) {
  if (!moduleKey) throw Error('Undefined module name');

  let [name, version] = parseModuleKey(moduleKey);

  if (isHttpModule(moduleKey)) {
    name = moduleKey;
    version = '';
    // unchanged
  } else {
    [name, version] = resolveModule(name, version);
  }

  moduleKey = getModuleKey(name, version);
  // Check cache once we're done massaging the version string
  const cachedEntry = moduleCache.get(moduleKey);
  if (cachedEntry) {
    return cachedEntry.promise;
  }

  // Set up the cache so subsequent requests for this module will get the same
  // promise object (and thus the same module), even if the module hasn't been
  // loaded yet
  /** @type {ModuleCacheEntry} */
  const cacheEntry = PromiseWithResolvers();
  moduleCache.set(moduleKey, cacheEntry);

  /** @type {Promise<Module>} */
  let promise;

  // Fetch module based on type
  if (isHttpModule(moduleKey)) {
    promise = fetchModuleFromURL(moduleKey);
  } else {
    promise = fetchModuleFromNPM(name, version);
  }
  promise
    .catch(err => {
      if (err instanceof HttpError) {
        err.message = `Fetch failed for ${moduleKey} (code = ${err.code})`;
      }

      return Module.stub(moduleKey, err);
    })
    .then(module => {
      cacheEntry.module = module;

      // Add cache entry for module's computed key
      moduleCache.set(module.key, cacheEntry);

      // Resolve promise
      cacheEntry.resolve(module);
    });

  return cacheEntry.promise;
}

/**
 * @param {string} key
 */
export function getCachedModule(key) {
  return moduleCache.get(key)?.module;
}

/**
 * @param {Module} module
 */
export function cacheModule(module) {
  const moduleKey = module.key;
  const entry = moduleCache.get(moduleKey);

  if (entry) {
    entry.resolve(module);
  } else {
    moduleCache.set(moduleKey, {
      promise: Promise.resolve(module),
      module,
      resolve() {},
      reject() {},
    });
  }
}

/**
 * Convenience method for getting loaded modules by some criteria.
 * @param {QueryType} queryType
 * @param {string} queryValue
 */
export function queryModuleCache(queryType, queryValue) {
  /** @type {Map<string, Module>} */
  const results = new Map();

  if (!queryType || !queryValue) return results;

  for (const { module } of moduleCache.values()) {
    if (!module) continue;

    switch (queryType) {
      case 'exact':
        if (module.key === queryValue) results.set(module.key, module);
        break;
      case 'name':
        if (module.name === queryValue) results.set(module.key, module);
        break;
      case 'license':
        if (module.getLicenses().includes(queryValue.toLowerCase()))
          results.set(module.key, module);
        break;
      case 'maintainer':
        if (module.maintainers.find(({ name }) => name === queryValue))
          results.set(module.key, module);
        break;
    }
  }

  return results;
}

/** @type {(keyof import('@npm/types').PackageJson)[]} */
const PACKAGE_WHITELIST = [
  'author',
  'dependencies',
  'devDependencies',
  'license',
  'name',
  'peerDependencies',
  'version',
];

/**
 * @param {import('@npm/types').PackageJson} pkg
 */
export function sanitizePackageKeys(pkg) {
  /** @type {import('@npm/types').PackageJson} */
  const sanitized = {};

  for (const key of PACKAGE_WHITELIST) {
    if (key in pkg) (sanitized[key]) = pkg[key];
  }

  return sanitized;
}

/**
 * @param {import('@npm/types').PackumentVersion} pkg
 */
export function cacheLocalPackage(pkg) {
  let packument = getCachedPackument(pkg.name);
  if (!packument) {
    // Create a stub packument
    packument = {
      name: pkg.name,
      versions: {},
      'dist-tags': {},
      maintainers: [],
      time: {
        modified: new Date().toISOString(),
        created: new Date().toISOString(),
      },
      license: pkg.license ?? 'UNLICENSED',
    };

    // Put it into the packument cache
    cachePackument(pkg.name, packument);
  }

  // Add version to packument
  packument.versions[pkg.version] = pkg;

  const module = new Module(pkg);

  module.isLocal = true;

  // Put module in cache and local cache
  cacheModule(module);

  return module;
}

/** @type {string | null} */
let lastPackagesVal;

// Make sure any packages in the URL hash are loaded into the module cache
export function syncPackagesHash() {
  const url = new URLPlus(window.location.href);
  const packagesJson = url.getHashParam(PARAM_PACKAGES);

  // If the hash param hasn't changed, there's nothing to do
  if (lastPackagesVal === packagesJson) return;
  lastPackagesVal = packagesJson;

  if (!packagesJson) return;

  /** @type {import('@npm/types').PackageJson[]} */
  let packages;
  try {
    packages = JSON.parse(packagesJson);
  } catch (err) {
    flash('"packages" hash param is not valid JSON');
    return;
  }

  for (const pkg of packages) {
    cacheLocalPackage(pkg);
  }
}
