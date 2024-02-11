export default class URLPlus extends URL {
  /**
   * @param {string} key
   */
  getHashParam(key) {
    const params = new URLSearchParams(this.hash.slice(1));
    return params.get(key);
  }
  /**
   * @param {string} key
   * @param {string=} value
   */
  setHashParam(key, value) {
    const params = new URLSearchParams(this.hash.slice(1));
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    this.hash = params.toString();
  }
  /**
   * @param {string} key
   */
  getSearchParam(key) {
    const params = new URLSearchParams(this.search);
    return params.get(key);
  }
  /**
   * 
   * @param {string} key
   * @param {string=} value
   */
  setSearchParam(key, value) {
    const params = new URLSearchParams(this.search);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    this.search = params.toString();
  }
}
