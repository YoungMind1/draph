import React from 'react';
import styles from './ModuleScoreBar.module.scss';

/**
 * @param {{
 *  title: string;
 *  score: number;
 *  style?: React.CSSProperties;
 * }}
 */
export function ModuleScoreBar({
  title,
  score,
  style,
}) {
  const perc = (score * 100).toFixed(0) + '%';

  return (
    <>
      <span className={styles.label} style={style}>
        {title}
      </span>
      <div className={styles.bar}>
        <div
          className={styles.inner}
          style={{
            width: perc,
            backgroundColor: `hsl(${score * 120}, 50%, 50%)`,
            ...style,
          }}
        >
          {perc}
          &ensp;
        </div>
      </div>
    </>
  );
}
