import { useEffect, useState } from 'react';
import Module from '../../lib/Module.js';
import fetchJSON from '../../lib/fetchJSON.js';
import { ExternalLink } from '../ExternalLink.jsx';
import { ModuleBundleStats } from './ModuleBundleStats.jsx';
import { ModuleTreeMap } from './ModuleTreeMap.jsx';

/**
 * @param {{module: Module}}
 */
export default function ModuleBundleSize({ module }) {
  const pkg = module.package;

  /** @type {ReturnType<typeof useState<import('../../lib/fetch_types.js').BundlePhobiaData | Error>>} */
  const [bundleInfo, setBundleInfo] = useState();

  const pn = encodeURIComponent(`${pkg.name}@${pkg.version}`);
  const bpUrl = `https://bundlephobia.com/result?p=${pn}`;
  const bpApiUrl = `https://bundlephobia.com/api/size?package=${pn}`;

  useEffect(() => {
    if (module.isLocal) return;

    setBundleInfo(undefined);

    if (!pkg) return;

    fetchJSON(bpApiUrl, { silent: true, timeout: 5000 })
      .then(data => setBundleInfo(data))
      .catch(err => setBundleInfo(err));
  }, [pkg]);

  return (
    <>
      {!bundleInfo ? (
        'Loading ...'
      ) : bundleInfo instanceof Error ? (
        'Bundle size not currently available'
      ) : (
        <>
          <ModuleBundleStats bundleInfo={bundleInfo} />
          <ModuleTreeMap
            style={{ height: '150px', margin: '1em' }}
            data={bundleInfo}
          />
          Data source: <ExternalLink href={bpUrl}>BundlePhobia</ExternalLink>
        </>
      )}
    </>
  );
}
