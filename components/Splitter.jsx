import React from 'react';

import './Splitter.scss';

/**
 * @param {{
 *  onClick: () => void;
 *  isOpen: boolean;
 * }}
 */
export function Splitter({
  onClick,
  isOpen,
}) {
  return (
    <div id="splitter" className="bright-hover tab" onClick={onClick}>
      {isOpen ? '✗' : '\u{25c0}'}
    </div>
  );
}
