import React from 'react';
import human from '../../lib/human.js';

/**
 * @param {{
 *  bundleInfo: import('../../lib/fetch_types.js').BundlePhobiaData;
 * }}
 */
export function ModuleBundleStats({
  bundleInfo,
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
        gap: '.3em 1em',
      }}
    >
      <span>Minified:</span>
      <strong>{human(bundleInfo.size, 'B')}</strong>
      <span>Gzipped:</span>
      <strong>{human(bundleInfo.gzip, 'B')}</strong>
    </div>
  );
}
