import Controller from '@ember/controller';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { cached } from 'tracked-toolbox';
import { task, enqueueTask, timeout } from 'ember-concurrency';
import WordFinder from '../utils/wordFinder';
import { modifier } from 'ember-modifier';

export default class ApplicationController extends Controller {
  wordFinder;
  titles;
  usedTitles;
  @tracked isReady = false;
  @tracked title = '';
  @tracked previousWords = [];
  @tracked wordFeed = [];
  @tracked showSettings = false;
  @tracked showAllWords = false;
  @tracked showInstructions = false;
  @tracked baseHeight = 0;
  @tracked inactive = false;
  @service router;

  constructor() {
    super(...arguments);
    this.wordFinder = new WordFinder();
    this.usedTitles = ['Finder'];
    this.titles = [
      'Helper',
      'Assist',
      'Boost',
      'Relief',
      'Support',
      'Guide',
      'Advisor',
      'Aide',
      'Service',
      'Genie',
      'Usher',
      'Scout',
      'Spotter',
      'Explorer',
      'Buddy',
      'Utility',
      'Prompt',
      'Searcher',
      'Attendant',
      'Succor',
      'Powerup',
      'Auxiliary',
      'Concierge',
    ];
  }
  @task
  *initWordFinder() {
    const titleSlot = document.querySelector('#title-slot');
    this.title = 'Finder';
    yield timeout(500);
    titleSlot.classList.toggle('intro');
    yield timeout(100);
    titleSlot.classList.toggle('spin');
    yield timeout(500);
    yield this.wordFinder.init();
    titleSlot.classList.toggle('spin');
    yield timeout(1000);
    this.isReady = true;
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
    const start = last ? possibleWords.indexOf(last) + 1 : 0;
    const feed = possibleWords.slice(start);
    console.log('populate', last, start, feed, possibleWords);
    while (feed.length) {
      let words = feed.splice(0, 5);
      this.wordFeed = [...this.wordFeed, ...words];
      yield timeout(6);
    }
    // console.log('words', wordFeed)
  }
  @cached
  get isMobile() {
    return window.navigator.userAgent.includes('Mobile');
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
  get wordContainer() {
    return document.querySelector('.word-container');
  }
  get availHeight() {
    return this.baseHeight + this.wordContainer.scrollHeight;
  }
  get showPrompt() {
    return this.inactive && !this.wordFinder.lettersPlaced;
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
    const { isMobile, wordFinder, updateLetter, toggleDead } = this;
    return {
      isMobile,
      wordFinder,
      updateLetter,
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
  resetPossibleWords() {
    this.populateWords.cancelAll();
    this.wordFinder.possibleWordsDisplayCount = 0;
    this.wordFeed = [];
    this.previousWords = [];
  }
  /**
   * ACTIONS
   */
  updateSettings = () => {
    this.wordFinder.updateSettings();
    this.resetPossibleWords();
    this.wordFinder.getPossibleWords();
    this.populateWords.perform();
  };

  updateLetter = (to, value) => {
    // clear any inflight tasks
    this.populateWords.cancelAll();
    // clear wordFeed
    this.wordFeed = [];
    // update list
    this.wordFinder.updateLetter(to, value);
    this.populateWords.perform();
  };

  toggleDead = (value) => {
    if (value.from === 'start') {
      this.updateLetter('dead', value);
    } else {
      this.updateLetter('start', value);
    }
  };

  toggleSpin = (/* e */) => {
    const titleSlot = document.querySelector('#title-slot');
    this.spin.perform(titleSlot);
  };

  toggleSettings = () => {
    this.showSettings = !this.showSettings;
  };
  toggleInstructions = () => {
    this.showInstructions = !this.showInstructions;
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
  hideInfo = () => {
    this.wordFinder.letterInfo = undefined;
    this.wordFinder.wordInfo = undefined;
  };
  scrollTo = (pos) => {
    this.baseHeight = ++this.baseHeight % 2;
    this.wordContainer.scrollTo({
      top: pos,
      behavior: 'smooth',
    });
  };

  reset = () => {
    this.resetPossibleWords();
    this.wordFinder.reset();
  };

  /**
   * MODIFIERS
   */
  initFinder = modifier(() => {
    this.initWordFinder.perform();
  });
  toggleClass = modifier((el, [eventName, className, classTarget]) => {
    const target = classTarget ? document.querySelector(classTarget) : el;
    console.log('t', el, className, eventName, classTarget, target);
    const handler = (e) => {
      console.log('toggle', e, className, classTarget, target);
      target.classList.toggle(className);
    };
    if (!Array.isArray(eventName)) {
      eventName = [eventName];
    }
    for (const ev of eventName) {
      el.addEventListener(ev, handler);
    }

    return () => {
      for (const ev of eventName) {
        el.removeEventListener(ev, handler);
      }
    };
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
 8. stop body scroll when dragging (look at body-scroll-lock package)
 9. AWS ember-cli-deploy?
 10. double click to move to bad?
 11. calculate "wordle score" for word combos?
 12. exclusion mode - automatically exclude letters not included in found list 
 13. BUG: this.wordFeed.length is 0, but then the wordContainerMessage is a large list of possible words comma seperated

We should implement these in a way where they are simply toggles and the data is truly decoupled from the UI
 UI ideas:
 1. Tap to place:
  * tapping once selects and puts an outline on the letter, tapping the button again deselects
  * when selected, tap a tray to place
  * either hold or double tap to exclude

 2. Remote drag/joystick
  * dragging works like ios space bar
  * options:
    * drag moves a button icon
    * drag moves a cursor and highlights destinations

 3. Side drawer letter trays
  * can be left or right
  * drag triggered? 
 3b. Side drawer list
  * list is contained in side drawer that can be hidden and dragged in to keep out of way?

 CSS tweaks:
 settings:
 * align close button end, add x close
 * add orientation media queries (portrait/landscape)
 * add height media queries
 
 Decide on final name, maybe get input from friends 
 OR slot machine cycle/animate through a set of synonyms for assist on intro, 
 then pick the last one for the page and set it
 use: https://stackoverflow.com/questions/37713585/word-change-in-phase-css-vertical-animation-loop
 - css animation for slide in
 - use ec to switch value with timing
 - swap in with blurred images during spin?

 bonus. local storage for favoriting words?
 */
