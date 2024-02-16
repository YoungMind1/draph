import Module from '../../../lib/Module.js';
import BusFactorColorizer from './BusFactorColorizer.jsx';
import ModuleTypeColorizer from './ModuleTypeColorizer.jsx';
import { NPMSOverallColorizer } from './NPMSColorizer.jsx';
import OutdatedColorizer from './OutdatedColorizer.jsx';

/**
 * @typedef {{
 *   title: string;
 *   name: string;
 *   legend(): React.JSX.Element;
 * }} Colorizer
 */


/**
 * @typedef {Colorizer & {colorForModule: (module: Module) => Promise<string>}} SimpleColorizer
 */

/**
 * @typedef {Colorizer & {colorsForModules: (modules: Module[]) => Promise<Map<Module, string>>}} BulkColorizer
 */


/** @type {(SimpleColorizer | BulkColorizer)[]} */
const colorizers = [
  ModuleTypeColorizer,
  BusFactorColorizer,
  OutdatedColorizer,
  NPMSOverallColorizer,
];

/**
 * @param {Colorizer} colorizer
 * @returns {colorizer is SimpleColorizer}
 */
export function isSimpleColorizer(
  colorizer,
){
  return 'colorForModule' in colorizer;
}

/**
 * @param {string} name
 */
export function getColorizer(name) {
  return colorizers.find(colorizer => colorizer.name === name);
}

export default colorizers;
