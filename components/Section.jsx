import { HTMLProps } from 'react';
import { cn } from '../lib/dom.js';

import styles from './Section.module.scss';

/**
 * @param {{ title: string; open?: boolean } & HTMLProps<HTMLDetailsElement>}
 */
export function Section({
  title,
  className,
  children,
  open = true,
  ...props
}) {
  return (
    <details open={open} {...props} className={cn(className, styles.root)}>
      <summary>{title || 'Untitled'}</summary>
      {children}
    </details>
  );
}
