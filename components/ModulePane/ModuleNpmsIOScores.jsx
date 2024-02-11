import { useEffect, useState } from 'react';
import Module from '../../lib/Module.js';
import fetchJSON from '../../lib/fetchJSON.js';
import { ModuleScoreBar } from './ModuleScoreBar.jsx';

/**
 * @param {{module: Module}}
 */
export default function ModuleNpmsIOScores({ module }) {
  /** @type {ReturnType<typeof useState<import('../../lib/fetch_types.js').NPMSIODate | Error>>} */
  const [npmsData, setNpmsData] = useState();

  useEffect(() => {
    if (module.isLocal) return;

    setNpmsData(undefined);

    fetchJSON(
      `https://api.npms.io/v2/package/${encodeURIComponent(module.name)}`,
      { silent: true, timeout: 5000 },
    )
      .then(data => setNpmsData(data))
      .catch(err => setNpmsData(err));
  }, [module]);

  if (!npmsData) {
    return 'Loading ...';
  } else if (npmsData instanceof Error) {
    console.log('ERROR', npmsData);
    return 'Score not currently available';
  }

  /** @type {import('../../lib/fetch_types.js').NPMSIODate['score']} */
  const scores = npmsData.score;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
        marginTop: '1em',
        rowGap: '1px',
      }}
    >
      <ModuleScoreBar
        style={{ fontWeight: 'bold' }}
        title="Overall"
        score={scores.final}
      />
      <ModuleScoreBar
        style={{ fontSize: '.85em' }}
        title="Quality"
        score={scores.detail.quality}
      />
      <ModuleScoreBar
        style={{ fontSize: '.85em' }}
        title="Popularity"
        score={scores.detail.popularity}
      />
      <ModuleScoreBar
        style={{ fontSize: '.85em' }}
        title="Maintenance"
        score={scores.detail.maintenance}
      />
    </div>
  );
}
