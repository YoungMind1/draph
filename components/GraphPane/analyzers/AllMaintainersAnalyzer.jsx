import md5 from 'md5';
import simplur from 'simplur';
import Module from '../../../lib/Module.js';
import { Selectable } from '../../Selectable.jsx';
import styles from './AllMaintainersAnalyzer.module.scss';
import { Analyzer } from './Analyzer.js';

/**
 * @typedef {{
 *  modulesByMaintainer: Record<string, Module>;
 *  maintainerEmails: Record<string, string>;
 * }} MaintainerMapState 
 */

/**
 * @param {import('@npm/types').Maintainer | string} maintainer 
 */
function normalizeMaintainer(maintainer) {
  return !maintainer || typeof maintainer === 'string'
    ? { name: maintainer }
    : maintainer;
}

export class AllMaintainersAnalyzer extends Analyzer {
  /** @type {Record<string, Module[]>} */
  modulesByMaintainer = {};
  /** @type {Record<string, string>} */
  maintainerEmails = {};

  /**
   * @param {import('../../GraphDiagram/graph_util.js').GraphModuleInfo}
   */
  map({ module }) {
    if (module.isStub) return;

    const { maintainers } = module.package;

    // Consider adding "no maintainer" here? This will all the
    // SoloMaintainersAnalyzer to identifiy modules with no maintainers, which
    // may be helpful.
    if (!maintainers) return;

    for (const m of maintainers) {
      const maintainer = normalizeMaintainer(m);

      // Combine information the maintainer across multiple modules (increases
      // the odds of us having an email to generate gravatar image from)
      if (maintainer.email && maintainer.name) {
        this.maintainerEmails[maintainer.name] = maintainer.email;
      }

      if (!maintainer.name) {
        console.error(`Nameless maintainer "${m}" in ${module.key}`);
        maintainer.name = '\u{26A0}\u{FE0F} (unnamed maintainer)';
      }

      this.modulesByMaintainer[maintainer.name] ??= [];
      this.modulesByMaintainer[maintainer.name].push(module);
    }
  }

  reduce() {
    const details = Object.entries(this.modulesByMaintainer)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, modules]) => {
        const email = this.maintainerEmails[name];
        /** @type {JSX.Element | null} */
        let img = null;
        if (email) {
          img = (
            <img
              loading="lazy"
              src={`https://www.gravatar.com/avatar/${md5(email)}?s=32`}
            />
          );
        }

        return (
          <div className={styles.root} key={name}>
            <div className={styles.maintainer}>
              {img}
              <Selectable type="maintainer" value={name} />
            </div>

            <div className={styles.modules}>
              {modules.map(m => (
                <Selectable type="exact" value={m.key} key={m.key} />
              ))}
            </div>
          </div>
        );
      });

    if (details.length <= 0) return;

    const summary = simplur`All maintainers (${details.length})`;
    return { summary, details };
  }
}
