import React, { HTMLProps } from 'react';

/**
 * @param {HTMLProps<HTMLDivElement>}
 */
export function Tags({ children, style, ...props }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '10px',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
