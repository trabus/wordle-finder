/**
 * returns true if string includes any value in letters
 * @param {array} letters - letters to check
 * @param {string} value - string to check for letters
 */
export const stringIncludesLetters = (letters, value) => {
  let result = false,
    i = 0,
    len = letters.length;
  while (i < len) {
    if (value.includes(letters[i])) {
      result = true;
      break;
    }
    i++;
  }
  return result;
  // TODO: determine if the reduce is any less efficient memory or speedwise
  // return letters.reduce((bool, letter) => {
  //   const includes = value.includes(letter);
  //   return includes || bool;
  // }, false);
};

export const positionsMatchWordLetters = ({ positions, word, exclude }) => {
  return Object.keys(positions).reduce((bool, index) => {
    if (!positions[index].length) return bool;
    const match = positions[index].includes(word.charAt(index));
    return (exclude ? !match : match) && bool;
  }, true);
};

export default {
  positionsMatchWordLetters,
  stringIncludesLetters,
};
