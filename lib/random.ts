/**
 * @file lib/random.ts
 */

/**
 * Generates a random integer between the two given bounds, both inclusive.
 *
 * @param {number} min The lower bound number.
 * @param {number} max The upper bound number.
 *
 * @return {number} The randomly-generated integer.
 *
 * @source https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random#getting_a_random_integer_between_two_values_inclusive
 */
export const getRandomInclusiveInt = (min: number, max: number): number => {
  min = Math.ceil(min);
  max = Math.floor(max);

  return Math.floor(Math.random() * (max - min + 1) + min);
};
