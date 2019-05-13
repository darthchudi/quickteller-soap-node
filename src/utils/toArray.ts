/**
 * Checks if a given value is an array and returns it. If it isn't it wraps the data in an array and returns it
 * @param data The data to be checked
 */
export const toArray = <T>(data: T) => {
  const result = Array.isArray(data) ? data : [data];

  return result as T;
};
