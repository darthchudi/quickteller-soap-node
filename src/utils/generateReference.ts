import crypto from 'crypto';
import { promisify } from 'util';

const generateRandomBytes = promisify(crypto.randomBytes).bind(crypto);

/**
 * Generates a random reference string of a specified length
 * @param length THe length of the string to generate
 */
export const generateReference = async (length: number) => {
  const buffer: Buffer = await generateRandomBytes(Math.ceil(length / 2));
  return buffer.toString('hex').slice(0, length);
};
