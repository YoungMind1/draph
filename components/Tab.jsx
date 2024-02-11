import React, { HTMLProps } from 'react';
import { cn } from '../lib/dom.js';
import './Tab.scss';

/**
 * @param {HTMLProps<HTMLDivElement> & {
 *  active: boolean;
 *  badge?: string | number | boolean;
 * }}
 */
export function Tab({
  active,
  badge,
  children,
  ...props
}) {
  return (
    <div className={cn('tab bright-hover', { active })} {...props}>
      {children}
      {badge ? (
        <span className="badge">{badge === true ? ' ' : badge}</span>
      ) : null}
    </div>
  );
}
