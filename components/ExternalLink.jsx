import React, { HTMLProps } from 'react';
import { cn } from '../lib/dom.js';
import { OffsiteLinkIcon } from './Icons.jsx';

import './ExternalLink.scss';

/**
 * @param {HTMLProps<HTMLAnchorElement> & {
 *  className?: string;
 *  icon?: (props: import('./Icons.jsx').IconProps) => React.JSX.Element;
 *}}
 */
export function ExternalLink({
  href,
  children,
  target = '_blank',
  icon: IconComponent = OffsiteLinkIcon,
  className,
  ...props
}) {
  return (
    <a
      href={href}
      className={cn('bright-hover', 'external-link', className)}
      target={target}
      {...props}
    >
      {children}
      <IconComponent style={{ marginLeft: '0.2rem' }} />
    </a>
  );
}
