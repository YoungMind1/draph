import React, { HTMLProps } from 'react';
import { COLORIZE_COLORS } from '../../../lib/constants.js';

/**
 * @param {HTMLProps<HTMLDivElement>}
 */
export function LegendColor({
  color,
  children,
  ...props
}) {
  color = COLORIZE_COLORS[Number(color)] ?? color;

  return (
    <div {...props} style={{ margin: '.3rem 0' }}>
      <span style={{ color, marginRight: '0.5rem' }}>{'\u2B24'}</span>
      {children}
    </div>
  );
}
