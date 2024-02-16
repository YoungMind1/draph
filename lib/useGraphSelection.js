import { PARAM_SELECTION } from './constants.js';
import useHashParam from './useHashParam.js';

/**
 * @returns {const}
 */
export default function useGraphSelection() {
  const [sel, setSel] = useHashParam(PARAM_SELECTION);
  const i = (sel ?? '').indexOf(':');
  /** @type {import('./ModuleCache.js').QueryType} */
  const type = (sel && i > 0 ? sel?.slice(0, i) : '');
  const value = sel && i > 0 ? sel?.slice(i + 1) : '';

  return [
    type,
    value,
    /**
     * @param {import('./ModuleCache.js').QueryType=} queryType
     * @param {string=} queryValue
     */
    function setGraphSelection(queryType, queryValue) {
      if (!queryType || !queryValue) return setSel('');
      setSel(`${queryType}:${queryValue}`);
    },
  ];
}
