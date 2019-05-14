/**
 * Generates the quickteller error message
 * @param message Error message
 * @param code Quickteller response code
 * @param description Quickteller response description
 */
const getErrorMessage = (
  message: string,
  code?: number | string,
  description?: string
) => {
  return !code || !description
    ? message
    : `${message} with response code ${code}${
        !description ? '' : ` : ${description}`
      }`;
};

/**
 * Quickteller error class
 */
export class QuicktellerError extends Error {
  /**
   * Creates a new Quickteller error
   * @param message Error message
   * @param quickteller_code Quickteller response code
   * @param description Quickteller response description
   */
  constructor(
    message: string,
    readonly quickteller_code?: number | string,
    readonly description?: string
  ) {
    super(getErrorMessage(message, quickteller_code, description));
  }
}
