import React from 'react';
import Module from '../../../lib/Module.js';
import PromiseWithResolvers from '../../../lib/PromiseWithResolvers.js';
import fetchJSON from '../../../lib/fetchJSON.js';
import { flash } from '../../../lib/flash.js';
import { hslFor } from '../../GraphDiagram/graph_util.js';

// Max number of module names allowed per NPMS request
const NPMS_BULK_LIMIT = 250;

const COLORIZE_OVERALL = 'overall';
const COLORIZE_QUALITY = 'quality';
const COLORIZE_POPULARITY = 'popularity';
const COLORIZE_MAINTENANCE = 'maintenance';

/**
 * @implements {import('./index.js').BulkColorizer}
 */
class NPMSColorizer {
  /** @type {string} */
  title;
  /** @type {string} */
  name;

  /** @type {Module[]} */
  #pendingModules = [];
  /** @type {ReturnType<typeof import('../../../lib/PromiseWithResolvers.js').PromiseWithResolvers<unknown>>} */
  #pendingRequest = PromiseWithResolvers();

  /**
   * @param {string} title
   * @param {string} field
   */
  constructor(title, field) {
    this.title = title;
    this.name = field;
  }

  legend() {
    return (
      <div style={{ display: 'flex' }}>
        <span>0%&nbsp;</span>
        {new Array(20).fill(0).map((_, i) => (
          <span
            key={i}
            style={{ flexGrow: '1', backgroundColor: hslFor(i / 19) }}
          />
        ))}
        <span>&nbsp;100%</span>
      </div>
    );
  }

  /**
   * 
   * @param {Module[]} modules
   * @returns {Promise<Map<Module, string>>}
   */
  async colorsForModules(modules) {
    const moduleNames = [...new Set(modules.map(m => m.name))];

    /**
     * npms.io requests need to be batched
     * @type {Promise<Record<string, import('../../../lib/fetch_types.js').NPMSIODate>>[]}
     */
    const reqs = [];
    for (let i = 0; i < moduleNames.length; i += NPMS_BULK_LIMIT) {
      const namesInRequest = moduleNames.slice(i, i + NPMS_BULK_LIMIT);

      reqs.push(
        fetchJSON(
          'https://api.npms.io/v2/package/mget',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(namesInRequest),
            silent: true,
            timeout: 5000,
          },
        ),
      );
    }

    const results = await Promise.allSettled(reqs);

    /**
     * Merge results back into a single object
     * @type {{ [key: string]: import('../../../lib/fetch_types.js').NPMSIODate}}
     */
    const combinedResults = {};
    let rejected = 0;
    for (const result of results) {
      if (result.status == 'rejected') {
        rejected++;
      } else {
        Object.assign(combinedResults, result.value);
      }
    }

    if (rejected) {
      flash(`${rejected} of ${reqs.length} NPMS.io requests failed`, 'error');
    }

    /** @type {Map<Module, string>} */
    const colors = new Map();

    // Colorize nodes
    for (const m of modules) {
      const score = combinedResults[m.name]?.score;
      if (!score) continue;
      /** @type {string | undefined} */
      let color;
      switch (this.name) {
        case COLORIZE_OVERALL:
          color = hslFor(score.final);
          break;
        case COLORIZE_QUALITY:
          color = hslFor(score.detail.quality);
          break;
        case COLORIZE_POPULARITY:
          color = hslFor(score.detail.popularity);
          break;
        case COLORIZE_MAINTENANCE:
          color = hslFor(score.detail.maintenance);
          break;
      }
      if (color) {
        colors.set(m, color);
      }
    }

    return colors;
  }
}

export const NPMSOverallColorizer = new NPMSColorizer(
  'NPMS.io Score',
  COLORIZE_OVERALL,
);
export const NPMSPopularityColorizer = new NPMSColorizer(
  'NPMS.io Score (Popularity)',
  COLORIZE_POPULARITY,
);
export const NPMSQualityColorizer = new NPMSColorizer(
  'NPMS.io Score (Quality)',
  COLORIZE_QUALITY,
);
export const NPMSMaintenanceColorizer = new NPMSColorizer(
  'NPMS.io Score (Maintenance)',
  COLORIZE_MAINTENANCE,
);
