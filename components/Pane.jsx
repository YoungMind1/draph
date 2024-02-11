import React, { HTMLProps } from 'react';

/**
 * @param {HTMLProps<HTMLDivElement>}
 */
export function Pane({ children, ...props }) {
  return (
    <div className="pane" {...props}>
      {children}
    </div>
  );
}
