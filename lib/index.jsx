
import React from 'react';
import { createRoot } from 'react-dom/client';
import App, { setActivityForApp } from '../components/App/App.jsx';
import { DiagramTitle } from './DiagramTitle.js';
import LoadActivity from './LoadActivity.js';
import { syncPackagesHash } from './ModuleCache.js';
import { setActivityForRequestCache } from './fetchJSON.js';
import { flash } from './flash.js';
import { fetchCommits } from './useCommits.js';
import { Unsupported } from '../components/Unsupported.jsx';

function detectFeatures() {
  /** @type {JSX.Element[]} */
  const unsupported = [];

  unsupported.push();

  // API checks
  const features = {
    'AbortSignal.timeout': window.AbortSignal?.timeout,
    fetch: window.fetch,
    Promise: window.Promise,
  };

  for (const [k, v] of Object.entries(features)) {
    if (v) continue;

    unsupported.push(
      <>
        <code>{k}</code> is not supported
      </>,
    );
  }

  // localStorage may not work if cookies are disabled. See #202
  try {
    window.localStorage.setItem('test', 'test');
    window.localStorage.removeItem('test');
  } catch (err) {
    unsupported.push(
      <>
        <code>localStorage</code> is not supported
      </>,
    );
  }

  return unsupported;
}

window.addEventListener('error', err => {
  console.error(err);
  flash(err.message);
});

window.addEventListener('unhandledrejection', err => {
  console.error(err);
  flash(err.reason);
});

window.onload = function () {
  const unsupported = detectFeatures();
  if (unsupported.length > 0) {
    createRoot(document.querySelector('body') !== null).render(
      <Unsupported unsupported={unsupported} />,
    );
    return;
  }

  // Make sure module cache is synced with hash param
  syncPackagesHash();

  // Inject LoadActivity dependencies
  const activity = new LoadActivity();
  setActivityForRequestCache(activity);
  setActivityForApp(activity);

  /**
   * Main app component
   * @type {HTMLDivElement}
   */
  const appEl = document.querySelector('#app');
  createRoot(appEl).render(<App />);

  /**
   * A little component for managing the title
   * @type {HTMLTitleElement}
   */
  const titleEl = document.querySelector('title');
  createRoot(titleEl).render(<DiagramTitle defaultTitle={titleEl.innerText} />);

  // Lazily fetch information about commits to the npmgraph repo
  setTimeout(fetchCommits, 1000);
};
