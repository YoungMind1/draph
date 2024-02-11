import LoadActivity from '../../lib/LoadActivity.js';
import './Loader.scss';

import React, { HTMLProps } from 'react';

/**
 * @returns {{ activity: LoadActivity } & HTMLProps<HTMLDivElement>}
 */
export function Loader({
  activity,
}) {
  return (
    <div className="loader">
      <div className="bg" />
      {activity.title} ...
    </div>
  );
}
