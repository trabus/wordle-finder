import Tray from '../utils/tray';
import {
  positionsMatchWordLetters,
  stringIncludesLetters,
} from '../utils/exclude-include';
import { cached, tracked } from '@glimmer/tracking';
import { TrackedMap } from 'tracked-built-ins';
export default class Finder {
  static DISPLAY_COUNT = 500;
  #trays = [
    { id: 's', group: 'idle', label: '', name: 'available' },
    { id: 0, group: 'dead', label: '', name: 'excluded' },
    { id: 1, group: 'dead', label: '', name: 'excluded' },
    { id: 0, group: 'bad', label: '1', name: 'included' },
    { id: 1, group: 'bad', label: '2', name: 'included' },
    { id: 2, group: 'bad', label: '3', name: 'included' },
    { id: 3, group: 'bad', label: '4', name: 'included' },
    { id: 4, group: 'bad', label: '5', name: 'included' },
    { id: 0, group: 'good', label: '1', name: 'first' },
    { id: 1, group: 'good', label: '2', name: 'second' },
    { id: 2, group: 'good', label: '3', name: 'third' },
    { id: 3, group: 'good', label: '4', name: 'fourth' },
    { id: 4, group: 'good', label: '5', name: 'fifth' },
  ];
  #trayKeys = [];

  @tracked trays;
  @tracked words;
  @tracked settings;
  isPossibleWordsRunning;

  constructor({ words, settings }) {
    this.words = words;
    this.settings = settings;
    this.trays = new TrackedMap();
    /**
     * positions defines the location of different letters
     * each array only contains the letter keys
     */
    for (const p of this.#trays) {
      let items = [];
      if (p.id === 's') items = [...this.words.letters];
      const tray = new Tray(p);
      tray.setItems(items);
      // start tray will always hold all letters
      this.trays.set(tray.key, tray);
      // keep reference to all the tray keys
      this.#trayKeys.push(tray.key);
    }
  }

  get isRunning() {
    return this.isPossibleWordsRunning;
  }

  get isReady() {
    return this.words.isReady;
  }

  // letters for keyboard
  get keyboardLetters() {
    return this.settings.keyboards[this.settings.keyboard].values;
  }
  // TODO: not sure if these are still needed
  get b0Letters() {
    return this.trays.get('b0').items;
  }
  get b1Letters() {
    return this.trays.get('b1').items;
  }
  get b2Letters() {
    return this.trays.get('b2').items;
  }
  get b3Letters() {
    return this.trays.get('b3').items;
  }
  get b4Letters() {
    return this.trays.get('b4').items;
  }
  get g0Letters() {
    return this.trays.get('g0').items;
  }
  get g1Letters() {
    return this.trays.get('g1').items;
  }
  get g2Letters() {
    return this.trays.get('g2').items;
  }
  get g3Letters() {
    return this.trays.get('g3').items;
  }
  get g4Letters() {
    return this.trays.get('g4').items;
  }
  get d0Letters() {
    return this.trays.get('d0').items;
  }
  get d1Letters() {
    return this.trays.get('d1').items;
  }
  get sLetters() {
    return this.trays.get('s').items;
  }

  @cached
  get deadLetterValues() {
    return [...this.d0Letters, ...this.d1Letters];
  }
  // returns only placed values
  @cached
  get badLetterValues() {
    return [
      ...this.trays.get('b0').items,
      ...this.trays.get('b1').items,
      ...this.trays.get('b2').items,
      ...this.trays.get('b3').items,
      ...this.trays.get('b4').items,
    ].filter(Boolean);
  }
  // returns only placed values
  @cached
  get goodLetterValues() {
    return [
      ...this.trays.get('g0').items,
      ...this.trays.get('g1').items,
      ...this.trays.get('g2').items,
      ...this.trays.get('g3').items,
      ...this.trays.get('g4').items,
    ].filter(Boolean);
  }

  @cached
  get badLetterPositions() {
    const badLetters = {};
    for (let i = 0; i < 5; i++) {
      const position = this.trays.get('b' + i).items;
      badLetters[i] = [...position];
    }
    return badLetters;
  }
  // returns object with letter position index and letter at index (or undefined)
  @cached
  get goodLetterPositions() {
    const goodLetters = {};
    for (let i = 0; i < 5; i++) {
      const position = this.trays.get('g' + i).items;
      goodLetters[i] = [...position];
    }
    return goodLetters;
  }
  @cached
  get lettersPlaced() {
    return [
      ...this.goodLetterValues,
      ...this.badLetterValues,
      ...this.deadLetterValues,
    ];
  }

  @cached
  get possibleWords() {
    this.isPossibleWordsRunning = true;
    let words = [];
    // don't return anything until a letter is placed, or if we have too many found letters
    if (
      (!this.deadLetterValues.length && !this.foundLetterValues.length) ||
      (!this.deadLetterValues.length && !this.groupKeyExists)
    ) {
      this.isPossibleWordsRunning = false;
      return words;
    }
    // if a groupkey is defined and exists, return subset as input
    if (this.groupKeyExists) {
      words = this.words.letterSets.get(this.groupKey);
      if (this.settings.useCommon) {
        const wordscopy = [...words];
        words = wordscopy.filter((word) => this.words.isCommon(word));
      }
    } else {
      // otherwise return according to settings
      words = this.settings.useCommon
        ? this.settings.sortAlpha
          ? [...this.words.commonList].sort()
          : [...this.words.commonList]
        : this.words.wordList; // already sorted alphabetically
    }
    const uniqueWords = [...new Set(words)];
    const filteredWords = [];
    for (const word of uniqueWords) {
      if (!stringIncludesLetters(this.deadLetterValues, word))
        filteredWords.push(word);
    }
    if (
      Object.keys(this.goodLetterPositions).length ||
      Object.keys(this.badLetterPositions).length
    ) {
      const filtered = filteredWords.filter((word) => {
        return (
          positionsMatchWordLetters(this.goodLetterPositions, word, false) &&
          positionsMatchWordLetters(this.badLetterPositions, word, true)
        );
      });
      this.isPossibleWordsRunning = false;
      words = filtered;
    }
    return words;
  }

  @cached
  get possibleWordsCount() {
    return this.possibleWords?.length || 0;
  }

  @cached
  get groupKey() {
    return [...this.foundLetterValues].sort().join('');
  }

  @cached
  get groupKeyExists() {
    return this.words.letterSets.has(this.groupKey);
  }

  @cached
  get possibleLetters() {
    const excluded = [...this.foundLetterValues, ...this.deadLetterValues];
    return this.word.letters.filter((k) => {
      return !excluded.includes(k);
    });
  }

  // all letters included in found words
  @cached
  get foundWordLetters() {
    // join all letters, split them, and unique them
    return [...new Set(this.possibleWords.join('').split(''))];
  }

  // get possibleLettersByFrequency() {
  //   return [...this.possibleLetters].sort((a, b) => {
  //     return a[1].freq < b[1].freq ? 1 : a[1].freq === b[1].freq ? 0 : -1;
  //   });
  // }

  @cached
  get foundLetterValues() {
    return [...this.goodLetterValues, ...this.badLetterValues].filter(Boolean);
  }

  @cached
  get tooManyFoundLetters() {
    return (
      (this.badLetterValues.length > 0 && !this.possibleWordsCount) ||
      this.foundLetterValues.length > 5
    );
  }

  @cached
  get shouldExcludeLetters() {
    // TODO: This needs to be accounting for a reset before using foundWordLetters
    return this.words.letters.filter((k) => {
      return (
        !this.foundLetterValues.includes(k) &&
        !this.foundWordLetters.includes(k) &&
        !this.manualExcludedLetters.includes(k)
      );
    });
  }
  // TODO: auto exclusion!
  @cached
  get autoExcludedLetters() {
    return this.words.allLetterData
      .filter((letter) => {
        // console.log('auto', letter.name, letter.auto);
        return letter.location.includes('d1') && letter.auto;
      })
      .map((letter) => letter.name);
  }
  @cached
  get manualExcludedLetters() {
    return this.words.allLetterData
      .filter((letter) => {
        // console.log('manual', letter.name, letter.auto);
        return letter.location.includes('d0') && !letter.auto;
      })
      .map((letter) => letter.name);
  }

  @cached
  get excludedLetters() {
    if (!this.settings.autoExclude) return [...this.deadLetterValues];
    return [...this.manualExcludedLetters, ...this.autoExcludedLetters];
  }

  clearAllTrays() {
    Array.from(this.trays.keys()).forEach((key) => {
      this.trays.get(key).clearItems();
    });
  }

  getLetter = (value) => {
    return this.words.getLetter(value);
  };

  // updateLetters = (values) => {
  //   for (const [key, value] of Object.entries(values)) {
  //     this[key] = Array.isArray(value) ? [...value] : { ...value };
  //   }
  // };
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
  };

  // used for auto exclusion
  batchExclude = (...excluded) => {
    // get all letter data to cycle through
    const batch = new Map([
      ['d1', []],
      ['s', []],
    ]);
    // TODO: This needs to reset d1 letters and recalculate the intersection
    this.words.allLetterData.forEach((letterData) => {
      if (excluded.includes(letterData.name)) {
        // if (!this.foundLetterValues.length) {
        // }
        if (!letterData.location.includes('d')) letterData.auto = true;
        let dead = batch.get('d1');
        batch.set('d1', [...dead, letterData]);
      } else {
        if (letterData.location.includes('d1')) {
          letterData.auto = false;
          let start = batch.get('s');
          batch.set('s', [...start, letterData]);
        }
      }
      console.log('auto', letterData, batch);
    });
    this.batchUpdate(batch);
  };

  updateLetter = (...values) => {
    values.auto = false;
    this.updateList(...values);
  };

  resetAutoExcluded = () => {
    const batch = new Map([['s', []]]);
    this.d1Letters.forEach((k) => {
      let start = batch.get('s');
      batch.set('s', [...start, k]);
    });
    this.batchUpdate(batch);
  };

  updateList = (...values) => {
    const [to, letter] = values;
    // value will always be the letter instance
    const value =
      typeof letter === 'string' ? this.words.letterData.get(letter) : letter;
    const name = value.name;
    const from = value.location;
    // console.log(`to: ${to} , from ${from}`, value);
    const toList = this[`${to}Letters`];

    if (to === from) return;
    // don't accept more letters if full
    if (this.tooManyFoundLetters) {
      if (to.includes('b') && (!from.includes('b') || !from.includes('g')))
        return;
      if (to.includes('g') && from.includes('g') && toList.length) return;
    }
    // don't insert if already occupied
    // TODO: add swap functionality
    // console.log('removing ', value, fromIndex, fromList[fromIndex], [...fromList]);

    // let toItems = !to.includes('g') ? [...toList, name] : [name];
    value.location = to;
    this.trays.get(to).addItem(name);
    // console.log('to', to, this[`${to}Letters`], value);

    // if (to !== from) this.trays.get(from).removeItem(name);
    if (!to.includes('g') || (to.includes('g') && from.includes('b'))) {
      const fromItems = Array.isArray(from) ? from : [from];
      fromItems.forEach((val) => {
        this.trays.get(val).removeItem(name);
      });
    }

    // console.log('from', from, this[`${from}Letters`]);
    // console.log(this[`${from}Letters`], this[`${to}Letters`]);
    // console.log(`updated ${to}`, [...this[to]]);
  };

  reset = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
    this.clearAllTrays();
    this.words.allLetterData.forEach((value) => {
      value.reset();
    });
    this.trays.get('s').setItems([...this.words.letters]);
  };
}