import simplur from 'simplur';
import Module from '../../../lib/Module.js';
import { cn } from '../../../lib/dom.js';
import { LICENSES } from '../../../lib/licenses.js';
import { Selectable } from '../../Selectable.jsx';
import styles from './AllModulesAnalyzer.module.scss';
import { Analyzer } from './Analyzer.js';

export class LicenseKeywordAnalyzer extends Analyzer {
  /** @type {Module[]} */
  modules = [];

  /**
   * @param {import('../../GraphDiagram/graph_util.js').GraphState} graph
   * @param {import('../../../lib/licenses.js').OSIKeyword} keyword
   */
  constructor(
    graph,
    keyword,
  ) {
    super(graph);
  }

  /**
   * @param {import('../../GraphDiagram/graph_util.js').GraphModuleInfo}
   */
  map({ module }) {
    this.modules ??= [];

    if (module.isStub) return;

    const licenses = module.getLicenses();
    if (!licenses?.length) return;
    for (const license of licenses) {
      const keywords = LICENSES[license?.toLowerCase()]?.keywords;
      if (keywords?.includes(this.keyword)) this.modules.push(module);
    }
  }

  reduce() {
    if (!this.modules.length) return;

    const summary = simplur`Modules with "${this.keyword}" license (${this.modules.length})`;

    const details = this.modules
      .sort((a, b) => a.key.localeCompare(b.key))
      .map(module => (
        <div className={cn(styles.row)} key={module.key}>
          <Selectable
            className={cn(styles.name)}
            type="exact"
            value={module.key}
          />
        </div>
      ));

    return { summary, details };
  }
}
