import Controller from '@ember/controller';
import { service } from '@ember/service';
import { cached, tracked } from '@glimmer/tracking';
import { task, timeout } from 'ember-concurrency';
import { use } from 'ember-resources';
import { modifier } from 'ember-modifier';
import WordFeed from '../resources/word-feed';

const DISPLAY_COUNT = 500;
export default class ApplicationController extends Controller {
  wordFinder;
  titles;
  usedTitles;
  @tracked isReady = false;
  @tracked title = '';
  @tracked possibleWordsDisplayCount = DISPLAY_COUNT;
  @tracked showSettings = false;
  @tracked showAllWords = false;
  @tracked showInstructions = false;
  @tracked baseHeight = 0;
  @tracked inactive = false;
  @service settings;
  @service word;

  constructor() {
    super(...arguments);
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

    this.word.initWordFinder.perform(this.settings);
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
    yield this.wf.words.init();
    // console.log(this.wf)
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

  @use wordFeed = WordFeed.with(() => ({
    wordList: this.wf.possibleWords,
    displayCount: this.displayCount,
    increment: 80,
  }));

  get wf() {
    return this.word.finder;
  }
  @cached
  get isMobile() {
    return window.navigator.userAgent.includes('Mobile');
  }
  get startLetterLength() {
    return this.wf.sLetters.length;
  }
  get processWordCount() {
    return this.wf.possibleWordsCount || this.wf.totalWordCount;
  }

  get displayCount() {
    return this.possibleWordsDisplayCount;
  }
  set displayCount(value) {
    this.possibleWordsDisplayCount = value;
    if (value === 0) this.possibleWordsDisplayCount = DISPLAY_COUNT;
    if (
      value > this.wf.possibleWordsCount ||
      (this.wf.possibleWordsCount < DISPLAY_COUNT &&
        this.wf.possibleWordsCount !== 0)
    ) {
      this.possibleWordsDisplayCount = this.wf.possibleWordsCount;
    }
  }

  get hasMoreWords() {
    return this.displayCount <= this.wf.possibleWordsCount;
  }
  get wordContainer() {
    return document.querySelector('.word-container');
  }
  get availHeight() {
    return this.baseHeight + this.wordContainer.scrollHeight;
  }
  get showPrompt() {
    return this.inactive && !this.wf.lettersPlaced;
  }
  get showProcessingBar() {
    return this.wordFeed.isRunning && this.wf.possibleWordsCount > 0;
  }
  get wordContainerMessage() {
    return this.wf.possibleWordsCount
      ? this.wf.possibleWordsCount > 500
        ? ['too many words']
        : 'processing...'
      : this.wf.lettersPlaced.length
      ? 'no possible words with placed letters!'
      : 'place some letters above!';
  }

  get api() {
    const { isMobile, wf, updateLetter, toggleDead } = this;
    return {
      isMobile,
      wordFinder: wf,
      getLetter: wf.getLetter,
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
    this.displayCount = 0;
  }
  /**
   * ACTIONS
   */
  updateSettings = () => {
    this.resetPossibleWords();
  };

  updateLetter = (to, value) => {
    // update list
    this.wf.updateLetter(to, value);
    this.displayCount = 0;
  };

  toggleDead = (value) => {
    let letter = this.wf.getLetter(value);
    if (letter.location === 's') {
      // put it into d0 for manually excluded letters
      this.updateLetter('d0', value);
    } else {
      this.updateLetter('s', value);
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
  showUncommon = () => {
    this.settings.useCommon = false;
    this.updateSettings();
  };

  showMore = (count) => {
    const { possibleWordsCount } = this.wf;
    const { displayCount } = this;
    if (this.wordFeed.isRunning) {
      console.log('running');
      return;
    }
    this.displayCount = count + displayCount;
    if (count === possibleWordsCount || this.displayCount > possibleWordsCount)
      this.displayCount = possibleWordsCount;
  };
  hideInfo = () => {
    this.wf.letterInfo = undefined;
    this.wf.wordInfo = undefined;
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
    this.wf.reset();
  };

  /**
   * MODIFIERS
   */
  initFinder = modifier(() => {
    this.initWordFinder.perform();
  });
  toggleClass = modifier((el, [eventName, className, classTarget]) => {
    const target = classTarget ? document.querySelector(classTarget) : el;
    // console.log('t', el, className, eventName, classTarget, target);
    const handler = (e) => {
      // console.log('toggle', e, className, classTarget, target);
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
