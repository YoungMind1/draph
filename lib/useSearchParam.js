import useLocation from './useLocation.js';

/**
 * @template {string} T
 * @param {string} paramName
 * @returns {const}
 */
export default function useSearchParam(paramName) {
  const [location, setLocation] = useLocation();
  const params = new URLSearchParams(location.search);
  /** @type {T} */
  const value = (params.get(paramName) ?? '');

  /**
   * @param {T} val
   */
  const setValue = (val, replace = false) => {
    if (val === value) return;

    // Update state value
    if (!val) {
      params.delete(paramName);
    } else {
      params.set(paramName, val);
    }

    // Update page
    const url = new URL(location);
    url.search = params.toString();

    setLocation(url, replace);
  };

  return [value, setValue];
}
