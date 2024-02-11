import React, { HTMLProps } from 'react';
import { queryModuleCache } from '../lib/ModuleCache.js';
import { PARAM_HIDE } from '../lib/constants.js';
import useCommits from '../lib/useCommits.js';
import useGraphSelection from '../lib/useGraphSelection.js';
import useHashParam from '../lib/useHashParam.js';
import { version as VERSION } from '../package.json';
import AboutPane from './AboutPane/AboutPane.jsx';
import { useGraph, usePane } from './App/App.jsx';
import { ExternalLink } from './ExternalLink.jsx';
import GraphPane from './GraphPane/GraphPane.jsx';
import InfoPane from './InfoPane/InfoPane.jsx';
import './Inspector.scss';
import ModulePane from './ModulePane/ModulePane.jsx';
import { Splitter } from './Splitter.jsx';
import { Tab } from './Tab.jsx';

export const PANE = Object.freeze({
  MODULE: 'module',
  GRAPH: 'graph',
  INFO: 'info',
  ABOUT: 'about',
})

/**
 * @param {HTMLProps<HTMLDivElement} props
 */
export default function Inspector(props) {
  const [pane, setPane] = usePane();
  const [queryType, queryValue] = useGraphSelection();
  const [graph] = useGraph();
  const [, newCommitsCount] = useCommits();
  const [hide, setHide] = useHashParam(PARAM_HIDE);

  const selectedModules = queryModuleCache(queryType, queryValue);

  let paneComponent;
  switch (pane) {
    case PANE.MODULE:
      paneComponent = (
        <ModulePane id="pane-module" selectedModules={selectedModules} />
      );
      break;
    case PANE.GRAPH:
      paneComponent = <GraphPane id="pane-graph" graph={graph} />;
      break;
    case PANE.INFO:
      paneComponent = <InfoPane id="pane-info" />;
      break;
    case PANE.ABOUT:
      paneComponent = <AboutPane id="pane-about" />;
      break;
  }

  return (
    <div id="inspector" className={hide !== null ? '' : 'open'} {...props}>
      <div id="tabs">
        <Tab active={pane == PANE.INFO} onClick={() => setPane(PANE.INFO)}>
          Start
        </Tab>
        <Tab active={pane == PANE.GRAPH} onClick={() => setPane(PANE.GRAPH)}>
          Graph
        </Tab>
        <Tab active={pane == PANE.MODULE} onClick={() => setPane(PANE.MODULE)}>
          Module
        </Tab>
        <Tab
          active={pane == PANE.ABOUT}
          onClick={() => setPane(PANE.ABOUT)}
          badge={newCommitsCount > 0}
        >
          About
        </Tab>
        <Splitter
          isOpen={hide === null}
          onClick={() => setHide(hide === null)}
        />
      </div>

      {paneComponent}

      <footer>
        {'\xa9'} npmgraph Contributors &mdash;{' '}
        <ExternalLink id="github" href="https://github.com/npmgraph/npmgraph">
          GitHub
        </ExternalLink>{' '}
        &mdash; v{VERSION}
      </footer>
    </div>
  );
}
