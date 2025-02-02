import React from 'react';
import simplur from 'simplur';
import Module from '../../lib/Module.js';
import { PARAM_COLORIZE } from '../../lib/constants.js';
import useHashParam from '../../lib/useHashParam.js';
import { ExternalLink } from '../ExternalLink.jsx';
import OutdatedColorizer from '../GraphPane/colorizers/OutdatedColorizer.jsx';
import { GithubIcon } from '../Icons.jsx';
import { Pane } from '../Pane.jsx';
import { QueryLink } from '../QueryLink.jsx';
import { Section } from '../Section.jsx';
import { Tag } from '../Tag.jsx';
import { Tags } from '../Tags.jsx';
import ModuleBundleSize from './ModuleBundleSize.jsx';
import ModuleNpmsIOScores from './ModuleNpmsIOScores.jsx';
import styles from './ModulePane.module.scss';
import { ModuleVersionInfo } from './ModuleVersionInfo.jsx';
import { ReleaseTimeline } from './ReleaseTimeline.jsx';

/**
 * @param {{
 *  selectedModules?: Map<string, Module>;
 * } & React.HTMLAttributes<HTMLDivElement>}
 */
export default function ModulePane({
  selectedModules,
  ...props
}) {
  const [colorize] = useHashParam(PARAM_COLORIZE);
  const nSelected = selectedModules?.size ?? 0;
  if (nSelected == 0) {
    return (
      <Pane>
        No modules selected. Click a module in the graph to see details.
      </Pane>
    );
  } else if (nSelected > 1) {
    return (
      <Pane>
        Multiple modules selected. Click a single module in the graph to see
        details.
      </Pane>
    );
  }

  /** @type {Module} */
  const module = selectedModules?.values().next().value;

  const pkg = module.package;

  if (module.isLocal) {
    return (
      <Pane>
        <h2>
          <QueryLink query={module.key} reset={false} />
        </h2>
        <p>
          This is a locally-defined module. Additional information is not
          available at this time.
        </p>
      </Pane>
    );
  }

  if (module.isStub) {
    return (
      <Pane>
        <h2>{module.name}</h2>
        <p>Sorry, but info for this module isn't available. 😢</p>
        <p className={styles.stubError}>{module.stubError?.message}</p>
      </Pane>
    );
  }

  const maintainers = module.maintainers;

  const projectUrl = getProjectUrlForModule(module);
  let projectLink = null;
  if (projectUrl) {
    if (/github.com/i.test(projectUrl)) {
      projectLink = (
        <ExternalLink href={projectUrl} icon={GithubIcon}>
          Github
        </ExternalLink>
      );
    } else {
      projectLink = <ExternalLink href={projectUrl}>Project Page</ExternalLink>;
    }
  }

  const npmUrl = `https://www.npmjs.com/package/${module.name}/v/${module.version}`;

  const packageUrl = `https://cdn.jsdelivr.net/npm/${module.key}/package.json`;

  return (
    <Pane {...props}>
      <div
        style={{
          display: 'flex',
          padding: '0.5rem 0',
          gap: '1rem',
          flexWrap: 'wrap',
          alignItems: 'baseline',
        }}
      >
        <h2
          style={{
            flexGrow: 0,
            whiteSpace: 'nowrap',
            margin: 0,
          }}
        >
          <QueryLink query={module.key} />
        </h2>

        {!colorize || colorize === OutdatedColorizer.name ? (
          <ModuleVersionInfo module={module} style={{ flexGrow: 1 }} />
        ) : null}
      </div>

      {pkg.deprecated ? (
        <div
          className="warning"
          style={{ padding: '.5em', borderRadius: '.5em' }}
        >
          <h2 style={{ color: 'darkred', marginTop: 0 }}>Deprecated Module</h2>
          {pkg.deprecated}
        </div>
      ) : null}

      <p>{pkg?.description}</p>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <ExternalLink href={npmUrl}>npmjs.org</ExternalLink>
        {projectLink}
        <ExternalLink href={packageUrl}>package.json</ExternalLink>
      </div>

      <ReleaseTimeline module={module} />

      <Section title="Bundle Size">
        <ModuleBundleSize module={module} />
      </Section>

      <Section title="npms.io Score">
        <ModuleNpmsIOScores module={module} />
      </Section>

      <Section
        title={simplur`${Object.entries(maintainers).length} Maintainer[|s]`}
      >
        <Tags>
          {maintainers.map(({ name = 'Unknown', email }) => (
            <Tag
              key={name + email}
              type="maintainer"
              value={name}
              gravatar={email}
            />
          ))}
        </Tags>
      </Section>
    </Pane>
  );
}

/**
 * @param {Module} module
 */
function getProjectUrlForModule(module) {
  const { homepage, bugs, repository } = module.package;

  if (homepage) return homepage;

  // Look to repository and bugs fields for a github URL
  let repo;
  if (repository) {
    if (typeof repository === 'string') {
      repo = repository;
    } else {
      repo = repository.url;
    }
  } else if (homepage) {
    repo = homepage;
  } else if (bugs) {
    repo = bugs.url;
  }

  // Extract github project path from URL
  const match = repo?.match(/github.com\/([^/]+\/[^/?#]+)?/);
  if (!match) return undefined;

  repo = match[1].replace(/\.git$/, '');

  return `https://www.github.com/${repo}`;
}
