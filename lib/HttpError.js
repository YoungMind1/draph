export default class HttpError extends Error {
  /** @type {number} */
  code;

  /**
   * @param {number} code
   */
  constructor(code, message = `HTTP Error ${code}`) {
    super(message);
    this.code = code;
  }
}
