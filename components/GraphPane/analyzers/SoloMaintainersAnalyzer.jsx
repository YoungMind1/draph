import simplur from 'simplur';
import { AllMaintainersAnalyzer } from './AllMaintainersAnalyzer.jsx';

export class SoloMaintainersAnalyzer extends AllMaintainersAnalyzer {
  /**
   * @param {import('../../GraphDiagram/graph_util.js').GraphModuleInfo} moduleInfo 
   */
  map(moduleInfo) {
    if (moduleInfo.module.package?.maintainers?.length !== 1) return;

    super.map(moduleInfo);
  }

  reduce() {
    const results = super.reduce();
    if (!results) return results;

    // Total # of modules with <= 1 maintainer
    let nModules = 0;
    for (const m of Object.values(this.modulesByMaintainer)) {
      nModules += m.length;
    }

    results.summary = simplur`Modules with only one maintainer (${nModules})`;

    return results;
  }
}
