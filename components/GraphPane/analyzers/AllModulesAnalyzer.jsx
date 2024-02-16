import simplur from 'simplur';
import Module from '../../../lib/Module.js';
import { cn } from '../../../lib/dom.js';
import { Selectable } from '../../Selectable.jsx';
import styles from './AllModulesAnalyzer.module.scss';
import { Analyzer } from './Analyzer.js';

export class AllModulesAnalyzer extends Analyzer {
  /** @type {Set<Module>} */
  entryModules = new Set();
  /** @type {Map<string, import('../../GraphDiagram/graph_util.js').GraphModuleInfo>} */
  moduleInfos = new Map();

  map() {}

  reduce() {
    const { entryModules, moduleInfos } = this.graph;
    const summary = simplur`All modules (${entryModules.size} top level,  ${
      moduleInfos.size - entryModules.size
    } dependenc[y|ies])`;

    const details = Array.from(moduleInfos.values())
      .sort((a, b) => a.module.key.localeCompare(b.module.key))
      .map(({ module }) => {
        return (
          <div className={cn(styles.row)} key={module.key}>
            <Selectable
              className={cn(styles.name, {
                [styles.entry]: entryModules.has(module),
              })}
              type="exact"
              value={module.key}
            />
          </div>
        );
      });

    return { summary, details };
  }
}
