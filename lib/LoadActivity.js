/**
 * DOM maniulation methods
 * @typedef {(la: LoadActivity) => void} LoadActivityFn
 */

/**
 * Lite class for tracking async activity
 */
export default class LoadActivity {
  /** @type {string | null} */
  title = '';

  total = 0;
  active = 0;
  /** @type {LoadActivityFn | null} */
  onChange = null;

  get percent() {
    return `${(1 - this.active / this.total) * 100}%`;
  }

  /**
   * @param {string} title
   * @returns {() => void}
   */
  start(title) {
    if (title) this.title = title;
    this.total++;
    this.active++;
    this.onChange?.(this);

    let _finished = false;
    return () => {
      if (_finished) return;
      _finished = true;
      this.active--;
      if (!this.active) {
        this.total = 0;
        this.title = null;
      }
      this.onChange?.(this);
    };
  }
}
