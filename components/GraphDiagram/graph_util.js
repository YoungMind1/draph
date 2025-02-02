import simplur from 'simplur';
import Module from '../../lib/Module.js';
import { getModule } from '../../lib/ModuleCache.js';
import { getModuleKey } from '../../lib/module_util.js';

const FONT = 'Roboto Condensed, sans-serif';

const EDGE_ATTRIBUTES = {
  dependencies: '[color=black]',
  devDependencies: '[color=black]',
  peerDependencies:
    '[label=peer fontcolor="#bbbbbb" color="#bbbbbb" style=dashed]',
  optionalDependencies: '[color=black style=dashed]', // unused
  optionalDevDependencies: '[color=black style=dashed]', // unused
};

/**
 * @typedef {'dependencies'
 * | 'devDependencies'
 * | 'peerDependencies'
 * | 'optionalDependencies'} DependencyKey
 */

/**
 * @typedef {{
 * name: string;
 * version: string;
 * type: DependencyKey;
 * }} DependencyEntry
 */


/**
 * @typedef {{
 * module: Module;
 * type: DependencyKey;
 * }} Dependency
 */

/**
 * @typedef {{
 *  module: Module;
 *  level: number;
 *  upstream: Set<Dependency>;
 *  downstream: Set<Dependency>;
 * }} GraphModuleInfo
 */

/**
 * @typedef {{
 *  moduleInfos: Map<string, GraphModuleInfo>;
 *  entryModules: Set<Module>;
 * }} GraphState
 */

/** @type {Set<DependencyKey>} */
const DEPENDENCIES_ONLY = new Set(['dependencies']);

/**
 * @param {Module} module
 * @param {Set<DependencyKey>} dependencyTypes
 */
function getDependencyEntries(
  module,
  dependencyTypes,
  level = 0,
) {
  // We only add non-"dependencies" at the top-level.
  if (level > 0) dependencyTypes = DEPENDENCIES_ONLY;

  /** @type {Set<DependencyEntry>} */
  const depEntries = new Set();
  for (const type of dependencyTypes) {
    const deps = module.package[type];
    if (!deps) continue;

    // Only do one level for non-"dependencies"
    if (level > 0 && type != 'dependencies') continue;

    // Get entries, adding type to each entry
    for (const [name, version] of Object.entries(deps)) {
      depEntries.add({ name, version, type });
    }
  }

  return depEntries;
}

/**
 * Fetch the module dependency tree for a given query.
 * @param {string[]} query
 * @param {Set<DependencyKey>} dependencyTypes
 * @param {(m: Module) => boolean} moduleFilter
 */
export async function getGraphForQuery(
  query,
  dependencyTypes,
  moduleFilter,
) {
  /** @type {GraphState} */
  const graphState = {
    moduleInfos: new Map(),
    entryModules: new Set(),
  };

  /**
   * @param {Module[] | Module} module
   * @returns {Promise<GraphModuleInfo | void>}
   */
  async function _visit(
    module,
    level = 0,
    walk = true,
  ) {
    if (!module) return Promise.reject(Error('Undefined module'));

    // Array?  Apply to each element
    if (Array.isArray(module)) {
      await Promise.all(module.map(m => _visit(m, level)));
      return;
    }

    /** @type {GraphModuleInfo | undefined} */
    let info = graphState.moduleInfos.get(
      module.key,
    );
    if (info) {
      return info;
    }

    // Create object that captures info about how this module fits in the dependency graph
    info = {
      module,
      level,
      upstream: new Set(),
      downstream: new Set(),
    };
    graphState.moduleInfos.set(module.key, info);

    if (!walk) return info;

    /**
     * Get dependency entries
     * @type {Set<DependencyEntry>}
     */
    const downstreamEntries = moduleFilter(module)
      ? getDependencyEntries(module, dependencyTypes, level)
      : new Set();

    // Walk downstream dependencies
    await Promise.allSettled(
      [...downstreamEntries].map(async ({ name, version, type }) => {
        const downstreamModule = await getModule(getModuleKey(name, version));

        // Don't walk peerDependencies
        const moduleInfo = await _visit(
          downstreamModule,
          level + 1,
          type !== 'peerDependencies',
        );

        moduleInfo?.upstream.add({ module, type });
        info?.downstream.add({ module: downstreamModule, type });
      }),
    );

    return info;
  }

  // Walk dependencies of each module in the query
  return Promise.allSettled(
    query.map(async moduleKey => {
      const m = await getModule(moduleKey);
      graphState.entryModules.add(m);
      return m && _visit(m);
    }),
  ).then(() => graphState);
}

/**
 * @param {string} str
 */
function dotEscape(str) {
  return str.replace(/"/g, '\\"');
}

/**
 * Compose directed graph document (GraphViz notation)
 * @param {Map<string, GraphModuleInfo>} graph
 */
export function composeDOT(graph) {
  // Sort modules by [level, key]
  const entries = [...graph.entries()];
  entries.sort(([aKey, a], [bKey, b]) => {
    if (a.level != b.level) {
      return a.level - b.level;
    } else {
      return aKey < bKey ? -1 : aKey > bKey ? 1 : 0;
    }
  });

  const nodes = ['\n// Nodes & per-node styling'];
  const edges = ['\n// Edges & per-edge styling'];

  for (const [, { module, level, downstream }] of entries) {
    nodes.push(`"${dotEscape(module.key)}"${level == 0 ? ' [root=true]' : ''}`);
    if (!downstream) continue;
    for (const { module: dependency, type } of downstream) {
      edges.push(
        `"${dotEscape(module.key)}" -> "${dependency}" ${
          EDGE_ATTRIBUTES[type]
        }`,
      );
    }
  }

  const titleParts = entries
    .filter(([, m]) => m.level == 0)
    .map(([, m]) => dotEscape(m.module.name));

  const MAX_PARTS = 3;
  if (titleParts.length > MAX_PARTS) {
    titleParts.splice(
      MAX_PARTS,
      Infinity,
      simplur` and ${titleParts.length - MAX_PARTS} other module[|s]`,
    );
  }

  return [
    'digraph {',
    'rankdir="LR"',
    'labelloc="t"',
    `label="${titleParts.join(', ')}"`,
    '// Default styles',
    `graph [fontsize=16 fontname="${FONT}"]`,
    `node [shape=box style=rounded fontname="${FONT}" fontsize=11 height=0 width=0 margin=.04]`,
    `edge [fontsize=10, fontname="${FONT}" splines="polyline"]`,
    '',
  ]
    .concat(nodes)
    .concat(edges)
    .concat(
      graph.size > 1
        ? `{rank=same; ${[...graph.values()]
            .filter(info => info.level == 0)
            .map(info => `"${info.module}"`)
            .join('; ')};}`
        : '',
    )
    .concat('}')
    .join('\n');
}

/**
 * @param {GraphState} graphState
 * @param {IterableIterator<Module>} selectedModules
 */
export function gatherSelectionInfo(
  graphState,
  selectedModules,
) {
  // Gather *string* identifiers used to identify the various DOM elements that
  // represent the selection
  /** @type {Set<string>} */
  const selectedKeys = new Set();
  /** @type {Set<string>} */
  const upstreamEdgeKeys = new Set();
  /** @type {Set<string>} */
  const upstreamModuleKeys = new Set();
  /** @type {Set<string>} */
  const downstreamEdgeKeys = new Set();
  /** @type {Set<string>} */
  const downstreamModuleKeys = new Set();

  /**
   * @param {Module} fromModule
   * @param {Set<Module>} visited
   */
  function _visitUpstream(fromModule, visited = new Set()) {
    if (visited.has(fromModule)) return;
    visited.add(fromModule);

    const info = graphState.moduleInfos.get(fromModule.key);
    if (!info) return;

    for (const { module } of info.upstream) {
      upstreamModuleKeys.add(module.key);
      upstreamEdgeKeys.add(`${module.key}->${fromModule.key}`);
      _visitUpstream(module, visited);
    }
  }

  /**
   * @param {Module} fromModule 
   * @param {Set<Module>} visited
   */
  function _visitDownstream(fromModule, visited = new Set()) {
    if (visited.has(fromModule)) return;
    visited.add(fromModule);

    const info = graphState.moduleInfos.get(fromModule.key);
    if (!info) return;

    for (const { module } of info.downstream) {
      downstreamModuleKeys.add(module.key);
      downstreamEdgeKeys.add(`${fromModule.key}->${module.key}`);
      _visitDownstream(module, visited);
    }
  }

  for (const selectedModule of selectedModules) {
    selectedKeys.add(selectedModule.key);
    _visitUpstream(selectedModule);
    _visitDownstream(selectedModule);
  }

  return {
    selectedKeys,
    upstreamEdgeKeys,
    upstreamModuleKeys,
    downstreamEdgeKeys,
    downstreamModuleKeys,
  };
}

/**
 * Use color-mix to blend two colors in HSL space
 * @param {number} perc
 */
export function hslFor(perc) {
  return `hsl(${Math.round(perc * 120)}, 80%, var(--bg-L))`;
}
