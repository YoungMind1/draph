import { HTMLProps } from 'react';
import useGraphSelection from '../lib/useGraphSelection.js';

import { cn } from '../lib/dom.js';
import styles from './Selectable.module.scss';

/**
 * @param {{
 *  type: import('../lib/ModuleCache.js').QueryType;
 *  value: string;
 *  label?: string;
 * } & HTMLProps<HTMLSpanElement>}
 */
export function Selectable({
  type,
  value,
  label,
  className,
  ...props
}) {
  const [, , setGraphSelection] = useGraphSelection();
  const title = label || value;

  return (
    <span
      className={cn(styles.root, 'selectable', 'bright-hover', className)}
      title={title}
      onClick={() => setGraphSelection(type, value)}
      {...props}
    >
      {title}
    </span>
  );
}
