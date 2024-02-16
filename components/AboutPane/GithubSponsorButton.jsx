import React, { HTMLProps } from 'react';
import { cn } from '../../lib/dom.js';
import { SponsorIcon } from '../Icons.jsx';
import './GithubSponsorButton.scss';

/**
 * @param {HTMLProps<HTMLAnchorElement> & { username: string }}
 */
export default function GithubSponsorButton({
  className,
  username,
  ...props
}) {
  return (
    <a
      href={`https://github.com/sponsors/${username}`}
      className={cn('github-sponsor', className)}
      target="_blank"
      {...props}
    >
      <SponsorIcon />
      <span>Sponsor @{username}</span>
    </a>
  );
}
