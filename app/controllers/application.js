import Controller from '@ember/controller';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { task, timeout } from 'ember-concurrency';
import WordFinder from '../utils/wordFinder';

export default class ApplicationController extends Controller {
  wordFinder;
  titles;
  usedTitles;
  @tracked title = '';
  @service router;

  constructor() {
    super(...arguments);
    this.wordFinder = new WordFinder();
    this.usedTitles = ['finder'];
    this.titles = [
      'helper',
      'assist',
      'boost',
      'relief',
      'support',
      'guide',
      'advice',
      'aide',
      'service',
      'genie',
      'usher',
      'scout',
      'spotter',
    ];
  }
  @task
  *initWordFinder() {
    const titleSlot = document.querySelector('#title-slot');
    this.title = 'finder';
    yield timeout(500);
    titleSlot.classList.toggle('intro');
    yield timeout(100);
    titleSlot.classList.toggle('spin');
    yield timeout(500);
    yield this.wordFinder.init();
    titleSlot.classList.toggle('spin');
  }
  toggleSpin = (/* e */) => {
    const titleSlot = document.querySelector('#title-slot');
    this.spin.perform(titleSlot);
  };

  @task
  *spin(el) {
    this.title = this.getTitle();
    el.classList.toggle('spin');
    yield timeout(1000);
    el.classList.toggle('spin');
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
  getTitle() {
    let title = this.title;
    const index = Math.floor(Math.random() * this.titles.length);
    title = this.titles.splice(index, 1)[0];
    this.usedTitles.push(title);
    if (this.titles.length === 0) {
      this.titles = [...this.usedTitles];
      this.usedTitles = [];
    }
    return title;
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
 1. make word data use frequency to affect color or some other indicator
 2. more style tuning especially colors and fonts
 3. control tooltips or help popup, include credits
 3a. make current instruction a flyout
 3b. show bouncing "drag some letters up" after timeout, make position fixed
 4. duplicate good letter support? allow for more than one of the same letter in good slots
 5. more caching and tuning for performance
 6. add spinner or something for processing time, also disable buttons or toggle to prevent thrashing
 7. use qwerty keyboard, keep keys in place
 8. fix letter and word info, currently not displaying properly in prod
 9. AWS ember-cli-deploy?
 10. double click to move to bad?
 
 Decide on final name, maybe get input from friends 
 OR slot machine cycle/animate through a set of synonyms for assist on intro, 
 then pick the last one for the page and set it
 use: https://stackoverflow.com/questions/37713585/word-change-in-phase-css-vertical-animation-loop
 - css animation for slide in
 - use ec to switch value with timing
 - swap in with blurred images during spin?

 bonus. local storage for favoriting words?
 */
