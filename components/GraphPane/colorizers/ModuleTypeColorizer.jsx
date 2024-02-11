import React from 'react';
import Module from '../../../lib/Module.js';
import { LegendColor } from './LegendColor.jsx';

export const COLORIZE_MODULE_CJS = 'var(--bg-orange)';
export const COLORIZE_MODULE_ESM = 'var(--bg-blue)';

export default {
  title: 'Module Type',
  name: 'moduleType',

  legend() {
    return (
      <>
        <LegendColor color={COLORIZE_MODULE_CJS}>CommonJS (CJS)</LegendColor>
        <LegendColor color={COLORIZE_MODULE_ESM}>EcmaScript (ESM)</LegendColor>
      </>
    );
  },

  /**
   * @param {Module} module
   */
  async colorForModule(module) {
    /** @type {import('@npm/types').PackageJson} */
    const pkg = module.package;
    return pkg.type === 'module' ? COLORIZE_MODULE_ESM : COLORIZE_MODULE_CJS;
  },
};
