import { Graphviz } from '@hpcc-js/wasm';
import { select } from 'd3-selection';
import React, { useEffect, useState } from 'react';
import LoadActivity from '../../lib/LoadActivity.js';
import Module from '../../lib/Module.js';
import {
  getCachedModule,
  queryModuleCache,
} from '../../lib/ModuleCache.js';
import {
  PARAM_COLORIZE,
  PARAM_DEPENDENCIES,
  PARAM_HIDE,
  PARAM_ZOOM,
  ZOOM_FIT_HEIGHT,
  ZOOM_FIT_WIDTH,
  ZOOM_NONE,
} from '../../lib/constants.js';
import { createAbortable } from '../../lib/createAbortable.js';
import $ from '../../lib/dom.js';
import { flash } from '../../lib/flash.js';
import useCollapse from '../../lib/useCollapse.js';
import useGraphSelection from '../../lib/useGraphSelection.js';
import useHashParam from '../../lib/useHashParam.js';
import { useQuery } from '../../lib/useQuery.js';
import { useGraph, usePane } from '../App/App.jsx';
import {
  getColorizer,
  isSimpleColorizer,
} from '../GraphPane/colorizers/index.js';
import './GraphDiagram.scss';
import GraphDiagramDownloadButton from './GraphDiagramDownloadButton.jsx';
import { GraphDiagramZoomButtons } from './GraphDiagramZoomButtons.jsx';
import {
  composeDOT,
  gatherSelectionInfo,
  getGraphForQuery,
} from './graph_util.js';
import { PANE } from '../Inspector.jsx';

/**
 * @typedef {
 *  typeof ZOOM_NONE
 *  typeof ZOOM_FIT_WIDTH
 *  typeof ZOOM_FIT_HEIGHT
 * } ZoomOption
 */

/**
 * @returns {const}
 */
function useGraphviz() {
  /** @type {ReturnType<typeof useState<Graphviz | undefined>>} */
  const [graphviz, setGraphviz] = useState(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Graphviz.load()
      .catch(err => {
        console.error('Graphviz failed to load', err);
        return undefined;
      })
      .then(setGraphviz)
      .finally(() => setLoading(false));
  }, []);

  return [graphviz, loading];
}

/**
 * @param {{activity: LoadActivity}}
 */
export default function GraphDiagram({ activity }) {
  const [query] = useQuery();
  const [depTypes] = useHashParam(PARAM_DEPENDENCIES);
  const [, setPane] = usePane();
  const [, setZenMode] = useHashParam(PARAM_HIDE);
  const [queryType, queryValue, setGraphSelection] = useGraphSelection();
  const [graph, setGraph] = useGraph();
  const [collapse, setCollapse] = useCollapse();
  const [colorize] = useHashParam(PARAM_COLORIZE);
  const [zoom] = useHashParam(PARAM_ZOOM);
  const [graphviz, graphvizLoading] = useGraphviz();

  // Dependencies to include for top-level modules
  /** @type {Set<import('./graph_util.js').DependencyKey>} */
  const dependencyTypes = new Set([
    'dependencies',
    'peerDependencies',
  ]);
  (depTypes ?? '')
    .split(/\s*,\s*/)
    .sort()
    .forEach(dtype => dependencyTypes.add(dtype));

  // Signal for when Graph DOM changes
  const [domSignal, setDomSignal] = useState(0);

  /**
   * @param {React.MouseEvent} event
   */
  async function handleGraphClick(event) {
    /** @type {HTMLDivElement} */
    const target = event.target;

    if ($('#graph-controls').contains(target)) return;

    const el = $.up<SVGElement>(target, '.node');

    const moduleKey = el ? $(el, 'title')?.textContent?.trim() : '';
    const module = moduleKey ? getCachedModule(moduleKey) : undefined;

    // Toggle exclude filter?
    if (el && event.shiftKey) {
      if (module) {
        const isIncluded = collapse.includes(module.name);
        if (isIncluded) {
          setCollapse(collapse.filter(n => n !== module.name));
        } else {
          setCollapse([...collapse, module.name]);
        }
      }

      return;
    }

    if (el) setZenMode('');

    setGraphSelection('exact', moduleKey);
    setPane(moduleKey ? PANE.MODULE : PANE.GRAPH);
  }

  function applyZoom() {
    /** @type {ReturnType<typeof $<HTMLDivElement>()[0]>} */
    const graphEl = $('#graph')[0];
    const svg = getDiagramElement();
    if (!svg) return;

    // Note: Not using svg.getBBox() here because (for some reason???) it's
    // smaller than the actual bounding box
    const vb = svg.getAttribute('viewBox')?.split(' ').map(Number);
    if (!vb) return;

    const [, , w, h] = vb;
    graphEl.classList.toggle(
      'centered',
      zoom === ZOOM_NONE && w < graphEl.clientWidth && h < graphEl.clientHeight,
    );

    switch (zoom) {
      case ZOOM_NONE:
        svg.setAttribute('width', String(w));
        svg.setAttribute('height', String(h));
        break;

      case ZOOM_FIT_WIDTH:
        svg.setAttribute('width', '100%');
        svg.removeAttribute('height');
        break;

      case ZOOM_FIT_HEIGHT:
        svg.removeAttribute('width');
        svg.setAttribute('height', '100%');
        break;
    }

    (select('#graph svg .node').node())?.scrollIntoView();
  }

  /**
   * Filter for which modules should be shown / collapsed in the graph
   * @param {{name: string}}
   */
  function moduleFilter({ name }) {
    return !collapse?.includes(name);
  }

  // NOTE: Graph rendering can take a significant amount of time.  It is also dependent on UI settings.
  // Thus, it's broken up into different useEffect() actions, below.

  // Effect: Fetch modules
  useEffect(() => {
    const { signal, abort } = createAbortable();

    getGraphForQuery(query, dependencyTypes, moduleFilter).then(newGraph => {
      if (signal.aborted) return; // Check after async

      setGraph(newGraph);
    });

    return abort;
  }, [[...query].sort().join(), [...dependencyTypes].join(), collapse]);

  // Effect: Insert SVG markup into DOM
  useEffect(() => {
    const { signal, abort } = createAbortable();

    // Post-process rendered DOM
    const finish = activity.start('Rendering');

    // Render SVG markup (async)
    (async function () {
      if (!graphviz) return;

      if (signal.aborted) return; // Check after all async stuff

      // Compose SVG markup
      let svgMarkup = '<svg />';
      if (graph?.moduleInfos?.size) {
        const dotDoc = composeDOT(graph.moduleInfos);

        try {
          svgMarkup = graph?.moduleInfos.size
            ? await graphviz.dot(dotDoc, 'svg')
            : '<svg />';
        } catch (err) {
          console.error(err);
          flash('Error while rendering graph');
        }
      }
      if (signal.aborted) return; // Check after all async stuff

      /**
       * Parse markup
       * @type {SVGSVGElement}
       */
      const svgDom = new DOMParser().parseFromString(svgMarkup, 'image/svg+xml')
        .children[0];
      svgDom.remove();

      // Remove background element so page background shows thru
      $(svgDom, '.graph > polygon').remove();
      svgDom.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      svgDom.id = 'graph-diagram';

      // Inject into DOM
      const el = $('#graph');
      getDiagramElement()?.remove();
      el.appendChild(svgDom);

      // Inject bg pattern for deprecated modules
      const PATTERN = `<pattern id="warning"
        width="12" height="12"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(45 50 50)">
        <line class="line0" stroke-width="6px" x1="3" x2="3" y2="12"/>
        <line class="line1" stroke-width="6px" x1="9" x2="9" y2="12"/>
        </pattern>`;

      select('#graph svg').insert('defs', ':first-child').html(PATTERN);

      // Decorate DOM nodes with appropriate classname
      for (const el of $('#graph g.node')) {
        // Find module this node represents
        const key = $(el, 'text')[0].textContent;
        if (!key) continue;

        const m = getCachedModule(key);

        const graphInfo = graph?.moduleInfos.get(key);
        let isPeer;
        if (graphInfo) {
          let peerDeps = 0;
          for (const { type } of graphInfo.upstream) {
            if (type === 'peerDependencies') {
              peerDeps++;
            }
          }
          isPeer = peerDeps > 1 && peerDeps === graphInfo.upstream.size;
        } else {
          isPeer = false;
        }

        // Style peer dependencies
        el.classList.toggle('peer', isPeer);

        if (!m) continue;

        if (m?.package.deprecated) {
          el.classList.add('warning');
        }

        if (m.name) {
          el.dataset.module = m.key;
        } else {
          console.warn(`Bad replace: ${key}`);
        }

        if (!moduleFilter(m)) {
          el.classList.add('collapsed');
        }

        if (m.isStub) {
          el.classList.add('stub');
        }
      }

      // Signal other hooks that graph DOM has changed
      setDomSignal(domSignal + 1);

      finish?.();
    })();

    return () => {
      finish();
      abort();
    };
  }, [graphviz, graph]);

  // Effect: render graph selection
  useEffect(
    () => updateSelection(graph, queryType, queryValue),
    [queryType, queryValue, domSignal],
  );

  // Effect: Colorize nodes
  useEffect(() => {
    const svg = getDiagramElement();
    if (!svg) return;
    colorizeGraph(svg, colorize ?? '');
  }, [colorize, domSignal]);

  // (Re)apply zoom if/when it changes
  useEffect(applyZoom, [zoom, domSignal]);

  if (!graphviz) {
    if (graphvizLoading) {
      return (
        <div id="graph" className="graphviz-loading">
          {graphvizLoading
            ? 'Loading layout package...'
            : 'Layout package failed to load.'}
        </div>
      );
    }
  }

  return (
    <div id="graph" onClick={handleGraphClick}>
      <div id="graph-controls">
        <GraphDiagramZoomButtons />
        <GraphDiagramDownloadButton />
      </div>
    </div>
  );
}

/**
 * @param {import('./graph_util.js').GraphState | null} graph
 * @param {import('../../lib/ModuleCache.js').QueryType} queryType
 * @param {string} queryValue
 */
export function updateSelection(
  graph,
  queryType,
  queryValue,
) {
  if (!graph) return;

  const modules = queryModuleCache(queryType, queryValue);

  // Get selection info
  const si = gatherSelectionInfo(graph, modules.values());
  const isSelection = modules.size > 0;

  // Set selection classes for node elements
  const graphEl = document.querySelector('#graph');
  for (const el of [...$('svg .node[data-module]')]) {
    const moduleKey = el.dataset.module ?? '';
    const isSelected = si.selectedKeys.has(moduleKey);
    const isUpstream = si.upstreamModuleKeys.has(moduleKey);
    const isDownstream = si.downstreamModuleKeys.has(moduleKey);
    el.classList.toggle('selected', isSelection && isSelected);
    el.classList.toggle('upstream', isSelection && isUpstream);
    el.classList.toggle('downstream', isSelection && isDownstream);
    el.classList.toggle(
      'unselected',
      isSelection && !isSelected && !isUpstream && !isDownstream,
    );

    if (isSelection && isSelected) {
      // el.scrollIntoView({ behavior: 'smooth' });
      if (graphEl) {
        // Bug: graphEl.scrollIntoView() doesn't work for SVG elements in
        // Firefox.  And even in Chrome it just scrolls the element to *barely*
        // be in view, which isn't really what we want.  (We'd like element to
        // be centered in the view.)  So, instead, we manually compute the
        // scroll coordinates.
        const { top, left } = el.getBoundingClientRect();
        graphEl.scrollTo({
          left: graphEl.scrollLeft + left - graphEl.clientWidth / 2,
          top: graphEl.scrollTop + top - graphEl.clientHeight / 2,
          behavior: 'smooth',
        });
      }
    }
  }

  // Set selection classes for edge elements
  for (const titleEl of [...$('svg .edge')]) {
    const edgeTitle = $(titleEl, '.edge title')?.textContent ?? '';
    /** @type {ReturnType<typeof $.up<SVGPathElement>>} */
    const edge = $.up(titleEl, '.edge');
    if (!edge) continue;

    const isUpstream = si.upstreamEdgeKeys.has(edgeTitle);
    const isDownstream = si.downstreamEdgeKeys.has(edgeTitle);
    edge.classList.toggle('upstream', isSelection && isUpstream);
    edge.classList.toggle('downstream', isSelection && isDownstream);
    edge.classList.toggle(
      'unselected',
      isSelection && !isUpstream && !isDownstream,
    );

    // Move edge to end of child list so it's painted last
    if (isUpstream || isDownstream) {
      edge.parentElement?.appendChild(edge);
    }
  }
}

/**
 * @param {SVGSVGElement} svg
 * @param {string} colorize
 */
async function colorizeGraph(svg, colorize) {
  const colorizer = getColorizer(colorize);

  if (!colorizer) {
    // Unset all node colors
    $(svg, 'g.node path').attr('style', undefined);
    return;
  }

  /** @type {ReturnType<typeof $<SVGSVGElement>>} */
  const moduleEls = $(svg, 'g.node');

  if (isSimpleColorizer(colorizer)) {
    // For each node in graph
    for (const el of moduleEls) {
      const moduleKey = el.dataset.module;
      const m = moduleKey && getCachedModule(moduleKey);
      /** @type {ReturnType<typeof $<SVGPathElement>>()[0]} */
      const elPath = $(el, 'path')[0];

      // Reset color if there's no module
      if (!m) {
        elPath.style.fill = '';
        continue;
      }

      // Colorize it (async)
      colorizer
        .colorForModule(m)
        .catch(err => {
          console.warn(`Error colorizing ${m.name}: ${err.message}`);
          return null;
        })
        .then(color => {
          elPath.style.fill = color ?? '';
        });
    }
  } else {
    /**
     * Bundle up modules
     * @type {Module[]}
     */
    const modules = [];
    for (const el of moduleEls) {
      const moduleKey = el.dataset.module;
      const m = moduleKey && getCachedModule(moduleKey);
      if (m) modules.push(m);
    }

    // Get colors for all modules
    const colors = await colorizer.colorsForModules(modules);

    // Apply colors
    for (const el of moduleEls) {
      const moduleKey = el.dataset.module;
      const m = moduleKey && getCachedModule(moduleKey);
      /** @type {ReturnType<typeof $<SVGPathElement>>()[0]} */
      const elPath = $(el, 'path')[0];

      elPath.style.fill = (m && colors.get(m)) ?? '';
    }
  }

  return;
}

/**
 * @returns {ReturnType<typeof document.querySelector<SVGSVGElement>>}
 */
export function getDiagramElement() {
  return document.querySelector('#graph svg#graph-diagram');
}
