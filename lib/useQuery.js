import { PARAM_QUERY } from './constants.js';
import useSearchParam from './useSearchParam.js';

/**
 * @returns {const}
 */
export function useQuery() {
  const [queryString, setQueryString] = useSearchParam(PARAM_QUERY);
  const moduleKeys = queryString.split(/\s*,\s*/).filter(Boolean);
  return [
    moduleKeys,
    function setQuery(/** @type {string[]} */ moduleKeys = [], replace = false) {
      // Clean up keys
      moduleKeys = moduleKeys.filter(Boolean).map(key => {
        key = key.trim();

        // Don't lowercase URLs
        if (/https?:\/\//i.test(key)) return key;

        return key.toLowerCase();
      });
      moduleKeys = [...new Set(moduleKeys)];
      setQueryString(moduleKeys.join(','), replace);
    },
  ];
}
