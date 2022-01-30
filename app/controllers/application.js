import Controller from '@ember/controller';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { task, enqueueTask, timeout } from 'ember-concurrency';
import WordFinder from '../utils/wordFinder';
import { modifier } from 'ember-modifier';

export default class ApplicationController extends Controller {
  wordFinder;
  titles;
  usedTitles;
  @tracked title = '';
  @tracked previousWords = [];
  @tracked wordFeed = [];
  @tracked showSettings = false;
  @tracked showAllWords = false;
  @tracked baseHeight = 0;
  @tracked inactive = false;
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

  @task
  *spin(el) {
    this.title = this.getTitle();
    el.classList.toggle('spin');
    yield timeout(1000);
    el.classList.toggle('spin');
  }
  @enqueueTask
  *populateWords() {
    const { possibleWords, previousWords } = this;
    const last = previousWords.slice(-1)[0];
    const start = last ? possibleWords.indexOf(last) : 0;
    const feed = possibleWords.slice(start);
    // console.log('populate', last, start, feed, possibleWords)
    while (feed.length) {
      let words = feed.splice(0, 5);
      this.wordFeed = [...this.wordFeed, ...words];
      yield timeout(10);
    }
    // console.log('words', wordFeed)
  }

  get startLetterLength() {
    return this.wordFinder.startLetters.length;
  }
  get processWordCount() {
    return this.wordFinder.possibleWordCount || this.wordFinder.totalWordCount;
  }
  get possibleWords() {
    // only return the first 500 unless requested
    if (this.showAllWords) return this.wordFinder.possibleWords;
    const result = this.wordFinder.possibleWords.slice(
      0,
      this.wordFinder.possibleWordsDisplayCount
    );
    return result;
  }
  get hasMoreWords() {
    return this.possibleWords.length <= this.wordFinder.possibleWordCount;
  }
  get availHeight() {
    return this.baseHeight + document.querySelector('body').scrollHeight;
  }
  get showPrompt() {
    return this.inactive && !this.wordFinder.lettersPlaced;
  }
  get isMobile() {
    return window.navigator.userAgentData.mobile;
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
  get api() {
    const { wordFinder, updateList, toggleDead } = this;
    return {
      wordFinder,
      updateList,
      toggleDead,
    };
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
  /**
   * ACTIONS
   */
  updateList = (to, value) => {
    // clear any inflight tasks
    this.populateWords.cancelAll();
    // clear wordFeed
    this.wordFeed = [];
    // update list
    this.wordFinder.updateList(to, value);
    this.populateWords.perform();
  };
  toggleDead = (value) => {
    if (value.from === 'start') {
      this.updateList('dead', value);
    } else {
      this.updateList('start', value);
    }
  };
  toggleSpin = (/* e */) => {
    const titleSlot = document.querySelector('#title-slot');
    this.spin.perform(titleSlot);
  };
  toggleSettings = () => {
    this.showSettings = !this.showSettings;
  };
  showMore = (count) => {
    const { possibleWordsDisplayCount, possibleWordCount } = this.wordFinder;
    if (this.populateWords.isRunning) {
      return;
    }
    this.previousWords = [...this.wordFeed];
    if (possibleWordsDisplayCount <= possibleWordCount)
      this.wordFinder.possibleWordsDisplayCount += count;
    if (
      count === possibleWordCount ||
      this.wordFinder.possibleWordsDisplayCount > possibleWordCount
    )
      this.wordFinder.possibleWordsDisplayCount = possibleWordCount;
    this.populateWords.perform();
  };
  scrollTo = (pos) => {
    this.baseHeight = ++this.baseHeight % 2;
    window.scrollTo({
      top: pos,
      behavior: 'smooth',
    });
  };
  reset = () => {
    this.populateWords.cancelAll();
    this.wordFinder.possibleWordsDisplayCount = 0;
    this.wordFeed = [];
    this.wordFinder.reset();
  };

  /**
   * MODIFIERS
   */
  initFinder = modifier(() => {
    this.initWordFinder.perform();
  });
}

/**
 1. make word data use frequency to affect color or some other indicator
 2. more style tuning especially colors and fonts
 3. control tooltips or help popup, include credits
 3a. make current instruction a flyout
 3b. show bouncing "drag some letters up" after timeout, make position fixed
 4. duplicate good letter support? allow for more than one of the same letter in good slots
 5. keyboard layout using grid classes contextually applied
 6. add spinner or something for processing time, also disable buttons or toggle to prevent thrashing
 7. improve performance by processing words in small batches and yielding content, more caching and tuning for performance
 8. fix letter and word info, currently not displaying properly in prod
 9. AWS ember-cli-deploy?
 10. double click to move to bad?

 CSS tweaks:
 settings:
 * align close button end, add x close
 
 Decide on final name, maybe get input from friends 
 OR slot machine cycle/animate through a set of synonyms for assist on intro, 
 then pick the last one for the page and set it
 use: https://stackoverflow.com/questions/37713585/word-change-in-phase-css-vertical-animation-loop
 - css animation for slide in
 - use ec to switch value with timing
 - swap in with blurred images during spin?

 bonus. local storage for favoriting words?
 */
