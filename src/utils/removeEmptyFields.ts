import { pickBy } from 'lodash';

/**
 * Removes null and undefined fields from an object
 * @param obj The object to be stripped of empty fields
 */
export const removeEmptyFields = (obj: object) =>
  pickBy(obj, v => v !== undefined && v !== null);
