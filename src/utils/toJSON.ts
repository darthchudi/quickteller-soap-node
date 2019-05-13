import { Parser } from 'xml2js';
import { promisify } from 'util';

const parser = new Parser({ explicitArray: false, mergeAttrs: true });

/**
 *  Converts an XML string to a javascript object.
 */
export const toJSON: <T = any>(
  xml: string
) => Promise<{ Response: T }> = promisify(parser.parseString);
