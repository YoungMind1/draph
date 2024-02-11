import simplur from 'simplur';
import Module from '../../../lib/Module.js';
import { Selectable } from '../../Selectable.jsx';
import { Analyzer } from './Analyzer.js';
import styles from './DeprecatedModulesAnalyzer.module.scss';

export class DeprecatedModulesAnalyzer extends Analyzer {
  /** @type {Module[]} */
  deprecated = [];

  /**
   * @param {import('../../GraphDiagram/graph_util.js').GraphModuleInfo}
   */
  map({ module }) {
    if (module.package.deprecated) {
      this.deprecated.push(module);
    }
  }

  reduce() {
    if (this.deprecated.length <= 0) return;

    const details = this.deprecated
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(module => {
        return (
          <div className={styles.root} key={module.key}>
            <Selectable type="exact" value={module.key} />
            {': '}
            <span className={styles.body}>
              &rdquo;{module.package.deprecated}&ldquo;
            </span>
          </div>
        );
      });

    const summary = simplur`Deprecated modules (${this.deprecated.length})`;
    return { summary, details };
  }
}
