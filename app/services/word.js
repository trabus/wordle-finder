import Service from '@ember/service';
import wordlist from '../utils/wordlist';
// import { tracked } from '@glimmer/track';

export default class WordService extends Service {
  #wordList;
  #letterList;
  #groupList;
  #possibleWords;
  #goodLetters;
  #badLetters;
  #deadLetters;
  #goodLetterPositions;

  constructor() {
    super();
    this.#letterList = new Map();
    this.#groupList = new Map();
    this.#wordList = wordlist;
    this.buildLetterList();
    this.buildWordList();
  }

  get wordList() {
    return this.#wordList || [];
  }

  get letterList() {
    return this.#letterList;
  }

  get groupList() {
    return this.#groupList;
  }

  get totalWordListLetterCount() {
    return (this.wordList && this.wordList.join('').split('').length) || 0;
  }

  get possibleWords() {
    return this.#possibleWords;
  }

  get possibleLetters() {
    const letters = Array.from(this.letterList.keys()).filter((k) => {
      return ![...this.foundLetters, ...this.deadLetters].includes(k);
    });
    const possibleLetters = new Map();
    letters.forEach((letter) => {
      possibleLetters.set(letter, this.letterList.get(letter));
    });
    return possibleLetters;
  }

  get possibleLettersByFrequency() {
    return new Map(
      Array.from(this.possibleLetters.entries()).sort((a, b) => {
        return a[1].freq < b[1].freq ? 1 : a[1].freq === b[1].freq ? 0 : -1;
      })
    );
  }

  get foundLetters() {
    return [...this.goodLetters, ...this.badLetters];
  }

  get goodLetters() {
    return this.#goodLetters || [];
  }

  get goodLetterPositions() {
    return this.#goodLetterPositions || {};
  }

  set goodLetters(data) {
    const letters = Object.values(data);
    this.#goodLetters = letters;
    this.#goodLetterPositions = data;
    this.#possibleWords = this.updatePossibleWords();
  }

  get badLetters() {
    return this.#badLetters || [];
  }

  set badLetters(letters) {
    this.#badLetters = letters;
    this.#possibleWords = this.updatePossibleWords();
  }

  get deadLetters() {
    return this.#deadLetters || [];
  }

  set deadLetters(letters) {
    this.#deadLetters = letters;
    this.#possibleWords = this.updatePossibleWords();
  }

  buildLetterList = () => {
    const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
    letters.forEach((v) => {
      this.letterList.set(v, { count: 0, frequency: 0 });
    });
  };

  buildWordList = () => {
    this.wordList.forEach((word) => {
      const wordLetters = [...new Set(word.split('').sort())];
      // build letter info
      wordLetters.forEach((l) => {
        const val = this.letterList.get(l);
        val.count++;
        val.freq = (val.count / this.totalWordListLetterCount) * 100;
        this.letterList.set(l, val);
      });
      // identify keys of all possible sorted letter combos in word
      const keys = [];
      const combos = wordLetters.map((l) => {
        const i = wordLetters.indexOf(l);
        const len = wordLetters.length - 1;
        return [
          ...wordLetters.slice(i * -1 - 1),
          ...wordLetters.slice(0, len - (i - len) - len),
        ];
      });

      combos.forEach((combo) => {
        combo.reduce((acc, letter) => {
          const key = ''.concat(acc || '', letter);
          keys.push(key);
          return key;
        }, '');
      });
      const sortedKeys = keys.map((val) => {
        return val.split('').sort().join('');
      });

      [...new Set(sortedKeys)].forEach((key) => {
        const val = this.groupList.get(key) || [];
        val.push(word);
        this.groupList.set(key, val);
      });
    });
  };

  // if string includes letters
  stringIncludesLetters(letters, value) {
    return letters.reduce((bool, letter) => {
      const includes = value.includes(letter);
      return includes || bool;
    }, false);
  }

  updatePossibleWords() {
    console.log('updating possible');
    const { goodLetters, goodLetterPositions, deadLetters, foundLetters } =
      this;
    const groupKey = foundLetters.sort().join('');
    const words =
      this.groupList.get(groupKey) || this.deadLetterExclusion(deadLetters);
    const uniqueWords = [...new Set(words)];
    const filteredWords = uniqueWords.filter((word) => {
      return !this.stringIncludesLetters(deadLetters, word);
    });
    if (goodLetters && goodLetterPositions) {
      return filteredWords.filter((word) => {
        const add = Object.keys(goodLetterPositions).reduce((bool, index) => {
          const match = word.charAt(index) === goodLetterPositions[index];
          // console.log(index, word, word.charAt(index), goodLetterPositions[index], match, bool)
          return match && bool;
        }, true);
        // console.log(`add ${word}?`, add)
        return add;
      });
    }
    return words;
  }

  wordsFromGroups = (...groups) => {
    const possibleWords = groups.reduce((acc, val) => {
      const words = this.groupList.get(val);
      return [...acc, ...words];
    }, []);
    return possibleWords;
  };

  deadLetterExclusion = (letters) => {
    letters.sort();
    const keys = Array.from(this.groupList.keys());
    // go through all keys, remove any with an excluded letter
    const included = keys.filter((val) => {
      return !this.stringIncludesLetters(letters, val);
    });
    return this.wordsFromGroups(...included);
  };
}

// export default async (/*...letters*/) => {
//     const finder = new WordFinder();
//     const deadLetters = 'geatows'.split('');
//     const badLetters = 'c'.split('');
//     const goodLetters = { 1: 'r' };
//     await finder.init();
//     finder.deadLetters = deadLetters;
//     finder.badLetters = badLetters;
//     finder.goodLetters = goodLetters;
//     console.log(finder.foundLetters, finder.possibleWords);
//     console.log(finder.possibleLettersByFrequency);
//     // console.log(finder.foundLetters,finder.groupList.get(finder.foundLetters.sort().join('')))
//     return finder;
// }

/**
 * known letters
 * found letters
 * ignore letters
 */
