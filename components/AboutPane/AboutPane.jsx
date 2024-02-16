import React, { HTMLProps } from 'react';
import { ExternalLink } from '../ExternalLink.jsx';
import { GithubIcon } from '../Icons.jsx';
import { Pane } from '../Pane.jsx';
import './AboutPane.scss';
import { CommitList } from './CommitList.jsx';
import GithubSponsorButton from './GithubSponsorButton.jsx';

/**
 * @param {HTMLProps<HTMLDivElement>} props 
 */
export default function AboutPane(props) {
  return (
    <Pane {...props}>
      <div style={{ lineHeight: '1.5rem' }}>
        Questions or comments? Visit the{' '}
        <ExternalLink
          href="https://github.com/npmgraph/npmgraph"
          icon={GithubIcon}
        >
          Github repo
        </ExternalLink>
      </div>

      <p>
        Want to show your appreciation?
        <GithubSponsorButton username="broofa" style={{ marginLeft: '1rem' }} />
      </p>

      <CommitList />
    </Pane>
  );
}
