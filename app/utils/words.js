import Letter from '../utils/letter';
import { cached, tracked } from '@glimmer/tracking';
import { TrackedMap } from 'tracked-built-ins';
/**
 * Delegate class to manage and provide word and letter data
 */
export default class Words {
  #alphabet = 'abcdefghijklmnopqrstuvwxyz';
  #letters;
  #letterData;
  #wordData;
  #wordList = [];
  #commonList = [];
  #letterSets;
  #letterCounts;
  @tracked isReady = false;

  constructor({ wordList, wordData }) {
    this.#letters = this.#alphabet.split('');
    this.#wordList = wordList;
    this.#wordData = new Map(wordData);
    // might just set this as prebuilt array
    this.#commonList = wordData.map((word) => word[0]);
    // map of all Letter instances, keyed by letter
    this.#letterData = new TrackedMap();
    // map of all words matching letter sets, keyed by letter sets
    this.#letterSets = new Map();

    this.#letterCounts = {};
    for (const l of this.#letters) {
      this.#letterCounts[l] = { all: 0, common: 0 };
      // letterData holds Letter instances
      this.#letterData.set(l, new Letter(l));
    }
  }

  init() {
    return this.buildWordList();
  }

  @cached
  get totalWordListLetterCount() {
    return this.#wordList.join('').split('').length || 0;
  }
  @cached
  get totalCommonListLetterCount() {
    return this.commonList.join('').split('').length || 0;
  }
  @cached
  get totalWordCount() {
    return this.#wordList.length;
  }
  @cached
  get totalCommonCount() {
    return this.commonList.length;
  }
  @cached
  get commonList() {
    return this.#commonList;
  }
  @cached
  get wordList() {
    return this.#wordList;
  }
  @cached
  get allLetterData() {
    return Array.from(this.letterData.values());
  }
  @cached
  get letterData() {
    return this.#letterData;
  }
  @cached
  get letters() {
    return this.#letters;
  }
  @cached
  get letterSets() {
    return this.#letterSets;
  }

  isCommon(word) {
    return this.#commonList.includes(word);
  }

  buildLetterList = () => {
    for (const v of this.#letters) {
      const count = this.#letterCounts[v].all;
      const commonCount = this.#letterCounts[v].common;
      const frequency = (count / this.totalWordListLetterCount) * 100;
      const commonFrequency = (commonCount / this.totalCommonListLetterCount) * 100;
      const data = this.#letterData.get(v);
      // console.log('data', v, data)
      data.count = count;
      data.frequency = frequency;
      data.commonCount = commonCount;
      data.commonFrequency = commonFrequency;
      this.#letterData.set(v, data);
    }
    // console.log(this.#letterData);
  };

  buildWordKeys() {
    const words = [...this.#wordList];
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
        const words = this.#letterSets.get(key) || [];
        words.push(word);
        this.#letterSets.set(key, words);
      }
    }
    // this.buildLetterList();
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
          const counts = this.#letterCounts[letters[i]];
          // push in letter at predefined key offset from current letter (multiply to coerce to int)
          result.push(letters[i + k * 1]);
          // inc counts
          counts.all++;
          if (isCommon) counts.common++;
        }
        // removing duplicate letters reduced #letterSets length from 20945 to 13994, but increases build time from 726ms to 1340ms
        // TODO: determine if removing duplicates improves possible word finding times, or if they are needed for duplicate letter support
        // groupkeys.push([...new Set(result)].join(''));
        groupkeys.push(result.join(''));
      }
    }
    return [word, [...new Set(groupkeys)]];
  }

  getLetter = (l) => {
    return this.letterData.get(l);
  };
}
