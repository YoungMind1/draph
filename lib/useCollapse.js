import { useMemo } from 'react';
import { PARAM_COLLAPSE } from './constants.js';
import useHashParam from './useHashParam.js';

/**
 * 
 * @returns {const}
 */
export default function useCollapse() {
  const [val, setVal] = useHashParam(PARAM_COLLAPSE);
  const excludes = useMemo(
    () =>
      (val || '')
        .split(',')
        .filter(Boolean)
        .sort()
        .map(v => v.trim()),
    [val],
  );

  return [
    excludes,
    /**
     * @param {string[]} excludes
     */
    function (excludes) {
      setVal(excludes.sort().join(','));
    },
  ];
}
