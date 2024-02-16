import fetchJSON from './fetchJSON.js';
import sharedStateHook from './sharedStateHook.js';

/** @type {ReturnType<typeof sharedStateHook<import('./fetch_types.js').GithubCommit[]>>} */
const [useCommitState, setCommitState] = sharedStateHook([]);
const [useLastVisit, setLastVisit] = sharedStateHook(0);

export async function fetchCommits() {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  try {
    /** @type {ReturnType<typeof fetchJSON<import('./fetch_types.js').GithubCommit[]>>} */
    let commits = await fetchJSON(
      `https://api.github.com/repos/npmgraph/npmgraph/commits?since=${since.toISOString()}`,
      { silent: true, timeout: 5000 },
    );

    // Walk commits and tag commits we want to expose with the
    // conventional-commit type
    for (const commit of commits) {
      let { message } = commit.commit;
      let ccType = (message.match(/^([a-z]+):/)?.[1] ?? '').toLowerCase();

      // Strip ccType from message
      if (ccType) {
        message = message.slice(ccType.length + 1);
      }
      message = message.replace(/\n[\S\s]*/m, '').trim();

      if (ccType.startsWith('break')) ccType = 'breaking';
      else if (ccType.startsWith('feat')) ccType = 'feat';
      else if (ccType.startsWith('fix')) ccType = 'fix';
      else if (ccType.startsWith('doc')) ccType = 'docs';
      else ccType = '';

      commit.ccType = ccType;
      commit.ccMessage = message;
    }

    // Filter out commits we're not interested in
    commits = commits.filter(commit => Boolean(commit.ccType));

    setCommitState(commits);
  } catch (err) {
    // This is non-essential so don't cmoplain too loudly
    console.warn('Request for project commits failed');
  }

  // Not really part of fetching commits, but we don't want to access
  // localStorage until after we've done the feature detect logic.  So we read
  // lastVisit here rather than as part of loading the module.
  const lastVisit = Number(localStorage.getItem('lastVisit'));
  setLastVisit(lastVisit);
}

/**
 * @returns {const}
 */
export default function useCommits() {
  const [commits] = useCommitState();
  const [lastVisit] = useLastVisit();
  let newCount = 0;
  for (const commit of commits) {
    const date = Date.parse(commit.commit.author.date);
    commit.isNew = !isNaN(date) && date > lastVisit;
    newCount += commit.isNew ? 1 : 0;
  }

  function reset() {
    const now = Date.now();
    localStorage.setItem('lastVisit', String(now));
    setLastVisit(now);
  }

  return [commits, newCount, reset];
}
