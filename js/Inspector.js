/* global ENV */

import React from 'react';
import { tagify } from './util';
import md5 from 'md5';
import ModulePane from './ModulePane';
import GraphPane from './GraphPane';
import InfoPane from './InfoPane';
import { selectTag } from './Graph';
import { sharedState } from './App';

export function Fix() {
  return <span style={{ fontWeight: 'bold', color: 'red' }}>FIX!</span>;
}

export function ExternalLink({ href, children, target = '_blank', className, ...props }) {
  return <a href={href} className={`bright-hover ${className}`} target={target} {...props}>
  {children}
    <span className='material-icons'>open_in_new</span>
  </a>;
}

export function QueryLink({ query }) {
  const [, setQuery] = sharedState.use('query');
  if (!Array.isArray(query)) query = [query];
  const url = `${location.pathname}?q=${query.join(',')}`;
  function onClick(e) {
    e.preventDefault();
    setQuery(query);
    history.pushState(null, null, e.target.href);
  }
  return <a href={url} onClick={onClick}>{query.join(',')}</a>;
}

export function Section({ title, children, open = true, style, ...props }) {
  return <details open={open}>
    <summary>{title || 'Untitled'}</summary>
    {children}
  </details>;
}

export function Pane({ children, ...props }) {
  return <div className='pane theme-lite'>{children}</div>;
}

export function Tags({ children, style, ...props }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', ...style }} {...props}>
    {children}
  </div>;
}

export function Tag({ type, name, title = name, count = 0, gravatar, ...props }) {
  if (count > 1) title += ` (${count})`;

  let img = null;
  if (gravatar) {
    const hash = md5(gravatar);
    img = <img src={`https://www.gravatar.com/avatar/${hash}?s=32`} />;
  }

  return <div className={`tag ${type} bright-hover`} title={title}
    onClick={() => selectTag(tagify(type, name), true, true)}>{img}{title}</div>;
}

function Tab({ active, children, ...props }) {
  return <div className={`tab bright-hover ${active ? 'active' : ''}`} {...props}>{children}</div>;
}

export default function Inspector({ className, ...props }) {
  const [query, setQuery] = sharedState.use('query');
  const [pane, setPane] = sharedState.use('pane');
  const [module] = sharedState.use('module');
  const [graph] = sharedState.use('graph');

  let paneComponent;
  switch (pane) {
    case 'module': paneComponent = <ModulePane module={module} />; break;
    case 'graph': paneComponent = <GraphPane graph={graph} />; break;
    case 'info': paneComponent = <InfoPane />; break;
  }

  function doSearch(e) {
    // Convert input text to unique list of names
    const names = [...new Set(e.currentTarget.value.split(/,\s*/).filter(x => x))];

    // Update location
    const url = new URL(location);
    url.search = `?q=${names.join(',')}`;
    url.hash = '';
    history.replaceState(null, window.title, url);

    setQuery(names);
  }

  return <div id='inspector' className={`theme-light ${className}`} {...props} >
      <div id='tabs' className='theme-dark'>
        <Tab active={pane == 'module'} onClick={() => setPane('module')}>Module</Tab>
        <Tab active={pane == 'graph'} onClick={() => setPane('graph')}>Graph</Tab>
        <Tab active={pane == 'info'} onClick={() => setPane('info')}>{'\u{24d8}'}</Tab>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <input
            type='text'
            id='search-field'
            defaultValue={query}
            onKeyDown={e => {
              if (e.key == 'Enter') doSearch(e);
            }}
            onBlur={doSearch}
            placeholder={'\u{1F50D} \xa0Enter module name'}
            autoFocus
          />
        </div>
      </div>

      {paneComponent}

      <footer>
        {'\xa9'} NPMGraph Contributors
        {' '}&mdash;{' '}
        <ExternalLink id='github' href='//github.com/npmgraph/npmgraph'>GitHub</ExternalLink>
        {' '}&mdash;{' '}
        v{ENV.appVersion}
      </footer>
    </div>;
}
