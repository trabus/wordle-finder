import WordList from '../utils/word-list';
import WordLists from '../utils/wordlist';
import WordData from '../utils/word-data';
import longProcess from '../utils/long-process';
import { tracked } from '@glimmer/tracking';
import { cached } from 'tracked-toolbox';
import { task, lastValue } from 'ember-concurrency';

export default class WordFinder {
  letters;
  letterData;
  letterList;
  commonList;
  groupList;
  listLength = 9000;
  wordLists;
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
  @tracked keyboard = 'qwerty';

  constructor() {
    const wordData = WordData();
    this.wordLists = WordLists();
    this.wordList = WordList().words;
    this.wordData = new Map(wordData);
    this.letterList = new Map();
    this.groupList = new Map();
    this.commonList = wordData.map((word) => word[0]);

    // console.log(this.wordList.length, this.commonList.length);
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
        order: 'qwertyuioplkjhgfdsazxcvbnm',
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
        order: 'qwfpgjluyarstdhneiozxcbkm',
        values: [],
      },
    };
    Object.keys(this.keyboards).forEach((type) => {
      this.keyboards[type].values = this.keyboards[type].order.split('');
    });
    this.letters = [...this.keyboards.alpha.values];
    this.letterData = this.keyboards.alpha.values.map((l) => {
      return { name: l, from: 'start' };
    });
    this.startLetters = [...this.letterData];
  }

  init() {
    this.buildLetterList();
    this.buildWordList.perform();
  }

  @cached
  get totalWordListLetterCount() {
    return (this.wordList && this.wordList.join('').split('').length) || 0;
  }
  get totalWordCount() {
    return this.wordList.length;
  }
  get trayLetters() {
    const sortArray = this.keyboards[this.keyboard].values;
    const letters = [
      ...this.startLetters,
      ...this.deadLetters,
      ...this.badLetters,
      ...this.good0Letters,
      ...this.good1Letters,
      ...this.good2Letters,
      ...this.good3Letters,
      ...this.good4Letters,
    ].reduce(
      (sorted, letter) => {
        const { name } = letter;
        sorted[sortArray.indexOf(name)] = { ...letter };
        return sorted;
      },
      [...new Array(sortArray.length)]
    );
    return letters;
  }
  get keyboardOptions() {
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
  @lastValue('getPossibleWords')
  possibleWords = [];

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

  get possibleLettersByFrequency() {
    return new Map(
      Array.from(this.possibleLetters.entries()).sort((a, b) => {
        return a[1].freq < b[1].freq ? 1 : a[1].freq === b[1].freq ? 0 : -1;
      })
    );
  }
  get possibleWordCount() {
    return this.possibleWords.length;
  }

  get foundLetters() {
    return [...this.goodLetterValues, ...this.badLetterValues].filter(
      (letter) => Boolean(letter)
    );
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

  buildLetterList = () => {
    this.letters.forEach((v) => {
      this.letterList.set(v, { count: 0, frequency: 0 });
    });
  };

  @task
  *buildWordKeys() {
    const words = [...this.wordList];
    const keys = [];
    while (words.length) {
      const key = yield this.buildKeys.perform(words.splice(0, 1)[0]);
      keys.push(key);
    }
    return keys;
  }

  @task
  *buildWordList() {
    const keyData = yield this.buildWordKeys.perform();
    keyData.forEach((data) => {
      const [word, keys] = data;
      keys.forEach((key) => {
        const words = this.groupList.get(key) || [];
        words.push(word);
        this.groupList.set(key, words);
      });
    });
    this.isReady = true;
  }

  @task
  *buildPermutations(word) {
    function* perm(a, r) {
      if (r.length <= 0) {
        yield a;
      } else {
        yield* perm(a + r.charAt(0), r.substring(1, r.length));
        yield* perm(a, r.substring(1, r.length));
      }
      yield a;
    }
    const result = yield [...perm('', word)];
    return result;
  }

  @task
  *buildKeys(word) {
    const letters = word.split('').sort();
    // build letter info
    letters.forEach((l) => {
      const val = this.letterList.get(l);
      val.count++;
      val.frequency = (val.count / this.totalWordListLetterCount) * 100;
      this.letterList.set(l, val);
    });
    // identify keys of all possible sorted letter combos in word
    const keys = yield this.buildPermutations.perform(word);
    const sortedKeys = keys
      .map((val) => {
        return val.split('').sort().join('');
      })
      .sort();
    return [word, [...new Set(sortedKeys)].slice(1)];
  }

  // if string includes letters
  stringIncludesLetters(letters, value) {
    return letters.reduce((bool, letter) => {
      const includes = value.includes(letter);
      return includes || bool;
    }, false);
  }

  @task
  *getPossibleWords() {
    console.log('possible');
    // don't return anything until a letter is placed
    if (!this.foundLetters.length && !this.deadLetters.length) return [];
    const groupKey = this.foundLetters.sort().join('');
    let words = this.groupList.get(groupKey) || [];
    yield longProcess();
    // nonexistent key, no deadletters placed
    if (!words.length && !this.deadLetters.length) return [];
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
      words = [...words].filter((word) => {
        return this.commonList.includes(word);
      });
    }

    const uniqueWords = [...new Set(words)];
    const filteredWords = uniqueWords.filter((word) => {
      return !this.stringIncludesLetters(this.deadLetterValues, word);
    });
    const wordlog = {};
    const deleted = {};
    if (Object.keys(this.goodLetterPositions).length) {
      const filtered = yield filteredWords.filter((word) => {
        const add = Object.keys(this.goodLetterPositions).reduce(
          (bool, index) => {
            if (!this.goodLetterPositions[index]) return bool;
            const match =
              word.charAt(index) === this.goodLetterPositions[index];
            // debugging log
            wordlog[word] = {
              match,
              bool,
              index,
              word,
              char: word.charAt(index),
              pos: this.goodLetterPositions[index],
            };
            return match && bool;
          },
          true
        );
        if (!add) {
          // debugging log
          deleted[word] = { ...wordlog[word] };
          delete wordlog[word];
        }
        return add;
      });
      // console.log('wordlog', wordlog);
      // console.log('deleted', deleted);
      // console.log('pos', this.goodLetterPositions);
      return filtered;
    }
    return words;
  }

  updateLetters = (values) => {
    for (const [key, value] of Object.entries(values)) {
      this[key] = Array.isArray(value) ? [...value] : { ...value };
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
    const fromIndex = fromList.findIndex((v, i) => {
      return v.name === name;
    });

    // don't insert if already occupied
    if (to.includes('good') && this[toKey].length) return;
    // remove item from fromList
    console.log('removing ', value, fromIndex, fromList[fromIndex], [
      ...fromList,
    ]);

    console.log('writing', to, toList);
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
    this.getPossibleWords.perform();
    console.log(this);
  };
  reset = () => {
    // console.log('reset!', this)
    return [
      ...this.good0Letters,
      ...this.good1Letters,
      ...this.good2Letters,
      ...this.good3Letters,
      ...this.good4Letters,
      ...this.badLetters,
      ...this.deadLetters,
    ].forEach((value) => {
      this.updateList('start', value);
    });
  };

  updateSettings = () => {
    this.getPossibleWords.perform();
  };

  deadLetterExclusion = (letters, keys) => {
    letters.sort();
    if (!keys) return [];
    // go through all keys, remove any with an excluded letter
    return keys.filter((val) => {
      const includes = this.stringIncludesLetters(letters, val);
      // console.log('includes', !includes, val);
      return !includes;
    });
  };
}
