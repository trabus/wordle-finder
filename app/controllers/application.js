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
  toggleSpin = (e) => {
    e.target.classList.toggle('spin');
  }

  get startLetterLength() {
    return this.wordFinder.startLetters.length;
  }
  get trayLetterValues() {
    return this.wordFinder.trayLetters.sort((a, b) => {
      return a.name > b.name ? 1 : a.name === b.name ? 0 : -1;
    });
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
  toggleCommon = (e) => {
    this.wordFinder.useCommon = e.target.checked;
  };
  toggleAlpha = (e) => {
    this.wordFinder.sortAlpha = e.target.checked;
  };
}

/**
 1. make word data use frequency to affect color or some other indicator
 2. more style tuning especially colors and fonts
 3. control tooltips or help popup, include credits
 4. duplicate good letter support? allow for more than one of the same letter in good slots
 5. more caching and tuning for performance
 6. add spinner or something for processing time, also disable buttons or toggle to prevent thrashing
 7. local storage for favoriting words?
 8. AWS deployment and serving at trab.us/wordle-assist
 9. decide on final name, maybe get input from friends 
 OR slot machine cycle/animate through a set of synonyms for assist on intro, 
 then pick the last one for the page and set it
 use: https://stackoverflow.com/questions/37713585/word-change-in-phase-css-vertical-animation-loop
 - css animation for slide in
 - use ec to switch value with timing
 - swap in with blurred images during spin?
 */
