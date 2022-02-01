import WordList from '../utils/word-list';
import WordData from '../utils/word-data';
import { tracked } from '@glimmer/tracking';
import { cached } from 'tracked-toolbox';

export default class WordFinder {
  static DISPLAY_COUNT = 500;
  letters;
  qwerty;
  letterCounts;
  letterData;
  letterList;
  commonList;
  groupList;
  wordList;
  wordData;
  keyboards;

  @tracked good0Letters = [];
  @tracked good1Letters = [];
  @tracked good2Letters = [];
  @tracked good3Letters = [];
  @tracked good4Letters = [];
  @tracked badLetters = [];
  @tracked deadLetters = [];
  @tracked startLetters = [];
  @tracked isReady = false;
  @tracked useCommon = true;
  @tracked sortAlpha = false;
  @tracked autoExclude = false;
  @tracked keyboard = 'qwerty';
  @tracked letterInfo;
  @tracked wordInfo;
  @tracked showLetterInfo = false;
  @tracked showWordInfo = false;
  @tracked possibleWords = [];
  @tracked possibleWordsDisplayCount = 0; //WordFinder.DISPLAY_COUNT;

  constructor() {
    const wordData = WordData();
    this.wordList = WordList().words;
    this.wordData = new Map(wordData);
    this.letterList = new Map();
    this.groupList = new Map();
    this.commonList = wordData.map((word) => word[0]);

    this.keyboards = {
      alpha: {
        name: 'alpha',
        value: 'alpha',
        order: 'abcdefghijklmnopqrstuvwxyz',
        values: [],
      },
      qwerty: {
        name: 'qwerty',
        value: 'qwerty',
        order: 'qwertyuiopasdfghjklzxcvbnm',
        values: [],
      },
      dvorak: {
        name: 'dvorak',
        value: 'dvorak',
        order: 'pyfgcrlaoeuidhtnsqjkxbmwvz',
        values: [],
      },
      colemak: {
        name: 'colemak',
        value: 'colemak',
        order: 'qwfpgjluyarstdhneiozxcvbkm',
        values: [],
      },
    };
    Object.keys(this.keyboards).forEach((type) => {
      this.keyboards[type].values = this.keyboards[type].order.split('');
    });
    this.letters = [...this.keyboards.alpha.values];
    this.letterCounts = {};
    this.letterData = [];
    for (const l of this.letters) {
      this.letterCounts[l] = { all: 0, common: 0 };
      this.letterData.push({ name: l, from: 'start' });
    }
    this.startLetters = [...this.letterData];
  }

  init() {
    return this.buildWordList();
  }

  @cached
  get totalWordListLetterCount() {
    return this?.wordList.join('').split('').length || 0;
  }
  @cached
  get totalCommonListLetterCount() {
    return this?.commonList.join('').split('').length || 0;
  }
  @cached
  get totalWordCount() {
    return this.wordList.length;
  }
  @cached
  get totalCommonCount() {
    return this.commonList.length;
  }
  get allLetterData() {
    return [...this.startLetters, ...this.lettersPlaced];
  }
  get lettersPlaced() {
    return [
      ...this.badLetters,
      ...this.deadLetters,
      ...this.good0Letters,
      ...this.good1Letters,
      ...this.good2Letters,
      ...this.good3Letters,
      ...this.good4Letters,
    ];
  }
  get trayLetters() {
    const sortArray = this.keyboards[this.keyboard].values;
    const letters = this.allLetterData.reduce(
      (sorted, letter) => {
        const { name } = letter;
        sorted[sortArray.indexOf(name)] = { ...letter };
        return sorted;
      },
      [...new Array(sortArray.length)]
    );
    return letters;
  }
  get keyboardTypeOptions() {
    return Object.keys(this.keyboards).map((value) => this.keyboards[value]);
  }
  get badLetterValues() {
    return [...this.badLetters].map((i) => i.name);
  }
  get deadLetterValues() {
    return [...this.deadLetters].map((i) => i.name);
  }
  get goodLetterValues() {
    return Object.values(this.goodLetterPositions).filter((letter) =>
      Boolean(letter)
    );
  }

  // used for exlcuding words that don't match known positions
  @cached
  get goodLetterPositions() {
    const goodLetters = {};
    [
      ...this.good0Letters,
      ...this.good1Letters,
      ...this.good2Letters,
      ...this.good3Letters,
      ...this.good4Letters,
    ].forEach((letter) => {
      goodLetters[letter.from.slice(-1)] = letter.name;
    });
    return goodLetters;
  }

  get possibleLetters() {
    const letters = Array.from(this.letterList.keys()).filter((k) => {
      return ![...this.foundLetters, ...this.deadLetterValues].includes(k);
    });
    const possibleLetters = new Map();
    letters.forEach((letter) => {
      possibleLetters.set(letter, this.letterList.get(letter));
    });
    return possibleLetters;
  }
  // all letters included in found words
  get foundWordLetters() {
    return [...new Set(this.possibleWords.join('').split(''))];
  }

  get possibleLettersByFrequency() {
    return new Map(
      Array.from(this.possibleLetters.entries()).sort((a, b) => {
        return a[1].freq < b[1].freq ? 1 : a[1].freq === b[1].freq ? 0 : -1;
      })
    );
  }
  get possibleWordCount() {
    return this.possibleWords?.length || 0;
  }

  get foundLetters() {
    return [...this.goodLetterValues, ...this.badLetterValues].filter(
      (letter) => Boolean(letter)
    );
  }

  get excludedLetters() {
    return Array.from(this.letterList.keys()).filter((k) => {
      return !this.foundWordLetters.includes(k);
    });
  }

  get tooManyFoundLetters() {
    return this.foundLetters.length >= 5;
  }

  isCommon(word) {
    return this.commonList.includes(word);
  }

  buildLetterList = () => {
    for (const v of this.letters) {
      const count = this.letterCounts[v].all;
      const commonCount = this.letterCounts[v].common;
      const frequency = (count / this.totalWordListLetterCount) * 100;
      const commonFrequency =
        (commonCount / this.totalCommonListLetterCount) * 100;
      this.letterList.set(v, {
        count,
        frequency,
        commonCount,
        commonFrequency,
      });
    }
  };

  buildWordKeys() {
    const words = [...this.wordList];
    const keys = [];
    while (words.length) {
      const key = this.buildKeys(words.splice(0, 1)[0]);
      keys.push(key);
    }
    return keys;
  }

  buildWordList() {
    const keyData = this.buildWordKeys();
    for (const data of keyData) {
      const [word, keys] = data;
      for (const key of keys) {
        const words = this.groupList.get(key) || [];
        words.push(word);
        this.groupList.set(key, words);
      }
    }
    this.buildLetterList();
    this.isReady = true;
  }

  buildKeys(word) {
    const isCommon = this.isCommon(word);
    const letters = word.split('').sort();
    // magic numbers, yes, but it's faster by x4
    const indexes = [
      '01234',
      '0123',
      '0124',
      '012',
      '0134',
      '013',
      '014',
      '01',
      '0234',
      '023',
      '024',
      '02',
      '034',
      '03',
      '04',
      '0',
    ];
    const groupkeys = [];
    for (let i = 0, len = letters.length; i < len; i++) {
      for (const v of indexes) {
        const keys = v.slice().split('');
        const result = [];
        for (const k of keys) {
          const counts = this.letterCounts[letters[i]];
          // push in letter at predefined key offset from current letter (multiply to coerce to int)
          result.push(letters[i + k * 1]);
          // inc counts
          counts.all++;
          if (isCommon) counts.common++;
        }
        // removing duplicate letters reduced groupList length from 20945 to 13994, but increases build time from 726ms to 1340ms
        // TODO: determine if removing duplicates improves possible word finding times, or if they are needed for duplicate letter support
        // groupkeys.push([...new Set(result)].join(''));
        groupkeys.push(result.join(''));
      }
    }
    return [word, [...new Set(groupkeys)]];
  }

  // if string includes letters
  stringIncludesLetters(letters, value) {
    return letters.reduce((bool, letter) => {
      const includes = value.includes(letter);
      return includes || bool;
    }, false);
  }

  getPossibleWords() {
    this.possibleWords = [];
    const groupKey = this.foundLetters.sort().join('');
    const keyExists = this.groupList.has(groupKey);
    // don't return anything until a letter is placed, or if we have too many found letters
    if (
      (!this.foundLetters.length && !this.deadLetters.length) ||
      (this.tooManyFoundLetters && !keyExists)
    )
      return [];
    let words = this.groupList.get(groupKey) || [];

    // nonexistent key, no deadletters placed
    if (!keyExists && !this.deadLetters.length) return [];
    // we hit an nonexistent key, use deadletters
    if (!words.length) {
      const inputList = this.useCommon
        ? this.sortAlpha
          ? [...this.commonList].sort()
          : [...this.commonList]
        : this.wordList;
      words = this.deadLetterExclusion(this.deadLetterValues, inputList);
    }
    if (this.useCommon) {
      const wordscopy = [...words];
      words = wordscopy.filter((word) => {
        return this.commonList.includes(word);
      });
    }

    const uniqueWords = [...new Set(words)];
    const filteredWords = [];
    for (const word of uniqueWords) {
      if (!this.stringIncludesLetters(this.deadLetterValues, word))
        filteredWords.push(word);
    }
    // const wordlog = {};
    // const deleted = {};
    if (Object.keys(this.goodLetterPositions).length) {
      const filtered = filteredWords.filter((word) => {
        const add = Object.keys(this.goodLetterPositions).reduce(
          (bool, index) => {
            if (!this.goodLetterPositions[index]) return bool;
            const match =
              word.charAt(index) === this.goodLetterPositions[index];
            // debugging log
            // wordlog[word] = {match,bool,index,word,char: word.charAt(index),pos: this.goodLetterPositions[index]};
            return match && bool;
          },
          true
        );
        // if (!add) {
        //   debugging log
        //   deleted[word] = { ...wordlog[word] };
        //   delete wordlog[word];
        // }
        return add;
      });
      // console.log('wordlog', wordlog, 'deleted', deleted);
      words = filtered;
    }
    this.possibleWords = words;
    // set display count for possible words
    this.possibleWordsDisplayCount =
      words.length < WordFinder.DISPLAY_COUNT
        ? words.length
        : WordFinder.DISPLAY_COUNT;
  }

  updateLetters = (values) => {
    for (const [key, value] of Object.entries(values)) {
      this[key] = Array.isArray(value) ? [...value] : { ...value };
    }
  };
  // takes arrays ['dead',{name:'a',from:'start'}],['bad',{name:'c',from:'start'}]
  // OR a single map `{ dead: [{name:'a',from:'start'}, {name:'b',from:'bad'}]}
  batchUpdate = (...letters) => {
    let batch = letters;
    if (letters[0] instanceof Map) {
      // convert map to 2d array
      batch = [];
      letters[0].forEach((items, to) => {
        items.forEach((value) => {
          batch.push([to, value]);
        });
      });
    }
    batch.forEach((item) => {
      this.updateList(...item);
    });
    this.getPossibleWords();
  };

  batchExclude = (...letters) => {
    const items = this.allLetterData
      .map((letterData) => {
        if (letters.includes(letterData.name)) return letterData;
      })
      .filter(Boolean);
    this.batchUpdate(new Map([['dead', items]]));
  };

  updateLetter = (...values) => {
    this.updateList(...values);
    this.getPossibleWords();
    if (this.autoExclude) {
      this.batchExclude(...this.excludedLetters);
      // console.log('excluded', this.excludedLetters);
    }
  };

  updateList = (...values) => {
    const [to, value] = values;
    const { name, from } = value;
    console.log(`to: ${to} , from ${from}`, value);
    const toKey = `${to}Letters`;
    const fromKey = `${from}Letters`;
    const fromList = [...this[fromKey]];
    const toList = [...this[toKey]];
    const fromIndex = fromList.findIndex((v) => {
      return v.name === name;
    });
    // don't accept more letters if full
    if (this.tooManyFoundLetters) {
      if (
        to.includes('bad') &&
        (!from.includes('bad') || !from.includes('good'))
      )
        return;
      if (to.includes('good') && from.includes('good') && this[toKey].length)
        return;
    }
    // don't insert if already occupied
    // TODO: add swap functionality
    if (to.includes('good') && this[toKey].length) return;
    // debugging log
    // console.log('removing ', value, fromIndex, fromList[fromIndex], [...fromList]);

    if (to.includes('good')) {
      value.from = to;
      this[toKey] = [{ ...value }];
    } else {
      value.from = to;
      this[toKey] = [...toList, { ...value }];
    }
    if (from.includes('good')) {
      this[fromKey] = [];
    } else {
      if (to !== from) fromList.splice(fromIndex, 1);
      this[fromKey] = [...fromList];
    }
    // console.log(`updated ${to}`, [...this[to]]);
  };
  reset = () => {
    // console.log('reset!', this)
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
    this.lettersPlaced.forEach((value) => {
      this.updateList('start', value);
    });
    this.getPossibleWords();
  };

  updateSettings = () => {
    this.getPossibleWords();
  };

  deadLetterExclusion = (letters, keys) => {
    letters.sort();
    if (!keys) {
      return [];
    }
    // go through all keys, remove any with an excluded letter
    return keys.filter((val) => {
      const includes = this.stringIncludesLetters(letters, val);
      return !includes;
    });
  };
}

/**
 * Setup flow:
 * 0. word lists are loaded
 * 1. letter list is generated
 * 2. word lists are combined into main wordlist
 * 2. words are processed: see "Word process flow"
 * 3. letter counts are generated
 * 4. word data is processed
 *
 * Word process flow:
 * 1. main wordlist is iterated
 * 2. each word is split and all letter permutations are generated
 * 3. permutations are used as key for grouplist
 * 3a. key is looked up on grouplist
 * 3b. word is pushed into grouplist value
 * 3c. grouplist is reassigned to key value
 * 4.
 *
 * Processing flow:
 * 0. words are processed: see word process flow
 * 1. letter is placed/excluded
 * 2. key created with additive letters combined and sorted
 * 3. group is looked up by key
 * 4. letters
 *
 *
 * Improvment ideas:
 * 1. cumalatively add letter counts while processing instead of re-processing all letters
 * 2. process main wordlist in batches of a limited size with EC so they are interruptable if inputs change
 * 3. process word exclusion in batches of limited size with EC so they are interruptable if
 *    letters are selected (currently cannot be selected due to blocking process)
 * 4. see if we can process wordlist in background so we can get to the UI faster. If user places
 *    letter before list is ready, we can use EC to wait for it before processing
 */
