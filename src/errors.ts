/**
 * Quickteller error class
 */
export default class QuicktellerError extends Error {
  /**
   * Creates a new Quickteller error
   * @param message Error message
   * @param code Quickteller response code
   * @param description Quickteller response description
   */
  constructor(
    message: string,
    readonly code: number,
    readonly description: string
  ) {
    super(
      `${message} with response code ${code}${
        !description ? '' : ` : ${description}`
      }`
    );
  }
}
