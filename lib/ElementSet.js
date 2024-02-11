/**
 * @template {Element} T
 * @extends {Array<T>}
 */
export default class ElementSet extends Array {
  /**
   * @param  {[string, () => () => void]} args
   */
  on(...args) {
    const els = [...this];

    for (const el of els) {
      el.addEventListener(...args);
    }

    return function () {
      for (const el of els) {
        el.removeEventListener(...args);
      }
    };
  }

  clear() {
    return this.forEach(el => ((el).innerText = ''));
  }

  remove() {
    return this.forEach(el => el.remove());
  }

  contains(el) {
    return this.find(n => n.contains(el)) ? true : false;
  }

  /**
   * @param {string} k
   * @param {string=} v
   */
  attr(k, v) {
    if (arguments.length == 1) {
      return this[0]?.getAttribute(k);
    } else if (v == null) {
      this.forEach(el => el.removeAttribute(k));
    } else {
      this.forEach(el => el.setAttribute(k, v));
    }
  }

  /**
   * @returns {string}
   */
  get textContent() {
    return this[0]?.textContent ?? '';
  }

  set textContent(str) {
    this.forEach(el => (el.textContent = str));
  }

  get innerText() {
    return (this[0])?.innerText;
  }

  set innerText(str) {
    this.forEach(el => ((e).innerText = str));
  }

  get innerHTML() {
    return this[0]?.innerHTML;
  }

  set innerHTML(str) {
    this.forEach(el => (el.innerHTML = str));
  }

  appendChild(nel) {
    if (typeof nel == 'string') nel = document.createTextNode(nel);
    return this.forEach((el, i) => {
      el.appendChild(i > 0 ? nel : nel.cloneNode(true));
    });
  }
}
