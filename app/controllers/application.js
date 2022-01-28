import Controller from '@ember/controller';
import { service } from '@ember/service';
import { next } from '@ember/runloop';
import WordFinder from '../utils/wordFinder';

export default class ApplicationController extends Controller {
  wordFinder;

  @service router;

  constructor() {
    super(...arguments);

    this.wordFinder = new WordFinder();
    next(this, this.initWordFinder);
  }
  initWordFinder() {
    this.wordFinder.init();
  }

  get startLetterLength() {
    return this.wordFinder.startLetters.length;
  }
  get processWordCount() {
    return this.wordFinder.possibleWordCount || this.wordFinder.totalWordCount;
  }

  get wordContainerMessage() {
    return this.possibleWords?.length
      ? this.possibleWords.length > 500
        ? ['too many words']
        : this.wordFinder.possibleWords
      : this.wordFinder.lettersPlaced.length
      ? 'no possible words with placed letters!'
      : 'place some letters above!';
  }
  selectKeyboard = (e) => {
    this.wordFinder.keyboard = e.target.value;
  };
  toggleCommon = (e) => {
    this.wordFinder.useCommon = e.target.checked;
    this.wordFinder.updateSettings();
  };
  toggleAlpha = (e) => {
    this.wordFinder.sortAlpha = e.target.checked;
    this.wordFinder.updateSettings();
  };
}

/**
 1. fix good-letters so it clears entites that were dragged out - may need ot get more info setup in a different structure (maybe use drag event)
 2. build proper goodLetters structure so wordFinder can use it, i.e. an object with numbered keys and letter values - maybe filter empty keys?
 3. wire up wordFinder to react to data and update possibleWords - only show if less than specific threshold (like 50 or less?) - may need to work with tracked properties more, don't forget deep objects don't track (maybe use tracked-built-ins)
 4. setup wordFinder letterData (percentages, etc)
  
 
 */
