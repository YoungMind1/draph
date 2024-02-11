import React from 'react';

import { cn } from '../../lib/dom.js';
import styles from './AnalyzerItem.module.scss';
import { Analyzer } from './analyzers/Analyzer.js';

/**
 * @returns {{
 *  graph: import('../GraphDiagram/graph_util.js').GraphState;
 *  analyzer: Analyzer;
 *  type?: 'info' | 'warn' | 'error';
 * } & React.HTMLAttributes<HTMLDetailsElement>}
 */
export function AnalyzerItem({
  graph,
  analyzer,
  type = 'info',
  children,
  ...props
} ) {
  /** @type {string | null}  */
  let symbol = null;
  if (type === 'info') symbol = null;
  else if (type === 'warn') symbol = '\u{26a0}';
  else if (type === 'error') symbol = '\u{1f6ab}';

  let results;
  try {
    for (const [, moduleInfo] of graph.moduleInfos) {
      analyzer.map(moduleInfo);
    }

    results = analyzer.reduce();
  } catch (err) {
    console.error(err);
    return;
  }

  if (!results) return;
  const { summary, details } = results;

  return (
    <details className={cn(styles.root, styles[type])} {...props}>
      <summary className="bright-hover">
        <span className={styles.symbol}>{symbol}</span>
        {summary}
      </summary>
      {children ? <div className={styles.description}>{children}</div> : null}
      <div className={styles.body}>{details}</div>
    </details>
  );
}
