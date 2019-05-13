import { pickBy } from 'lodash';
import { Object } from '../typings';

/**
 * Removes null and undefined fields from an object
 * @param obj The object to be stripped of empty fields
 */
export const removeEmptyFields = (obj: object) =>
  pickBy<Object>(obj, v => v !== undefined && v !== null);
