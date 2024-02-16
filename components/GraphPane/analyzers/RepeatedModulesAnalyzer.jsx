import simplur from 'simplur';
import Module from '../../../lib/Module.js';
import { Selectable } from '../../Selectable.jsx';
import { Analyzer } from './Analyzer.js';
import styles from './RepeatedModulesAnalyzer.module.scss';

export class RepeatedModulesAnalyzer extends Analyzer {
  /** @type {Record<string, Module[]>} */
  versionsByName = {};

  /**
   * @param {import('../../GraphDiagram/graph_util.js').GraphModuleInfo}
   */
  map({ module }) {
    this.versionsByName[module.name] ??= [];
    this.versionsByName[module.name].push(module);
  }

  reduce() {
    const details = Object.entries(this.versionsByName)
      .filter(([, v]) => v.length > 1)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, versions]) => {
        return (
          <div className={styles.row} key={name}>
            <Selectable className={styles.name} type="name" value={name} />

            {versions.map(m => (
              <Selectable
                className={styles.version}
                type="exact"
                label={`${m.version}`}
                key={m.version}
                value={m.key}
              />
            ))}
          </div>
        );
      });

    if (details.length <= 0) return;

    const summary = simplur`Modules with multiple versions (${details.length})`;
    return { summary, details };
  }
}
