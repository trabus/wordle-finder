import { LifecycleResource } from 'ember-resources';
import { tracked, cached } from '@glimmer/tracking';

/**
 * We want to load the words, then slowly feed them. This resource should be able to take a starting point, and add upon it.
 * We need the total word list, the current offset, and the current wordlist slice
 */

export default class WordFeed extends LifecycleResource {
  // sliced value
  // full array of words to feed in
  @tracked endIndex = 0;
  // don't know if we need this yet, we might
  @tracked offset = 0;

  @tracked listLength = 0;

  @tracked isRunning = false;

  @cached
  get value() {
    const { wordList } = this.args.named;
    // console.log('wordlist', wordList)
    const result = wordList?.slice(this.offset, this.end) || [];
    return result;
  }

  get end() {
    const { displayCount } = this.args.named;
    return this.endIndex > displayCount ? displayCount : this.endIndex;
  }

  set end(val) {
    this.endIndex = val;
  }

  get count() {
    return this.end || 0;
  }
  get hasWords() {
    return this.listLength > 0;
  }

  get increment() {
    return this.args.named.increment || 20;
  }

  // @cached
  get length() {
    const { wordList } = this.args.named;
    return wordList.length || null;
  }

  setup() {
    const { wordList } = this.args.named;
    this.listLength = wordList.length;
  }

  update() {
    clearTimeout(this.timeoutId);
    const { displayCount } = this.args.named;
    if (this.end < displayCount) {
      this.isRunning = true;
      this.timeoutId = setTimeout(this.updateEnd, 100);
    } else {
      // console.log('clear', wordList.length)
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
      this.isRunning = false;
    }
  }

  teardown() {
    clearTimeout(this.timeoutId);
  }

  updateEnd = () => {
    const { wordList } = this.args.named;
    if (wordList.length === this.listLength && this.hasWords) {
      this.end += this.increment;
    } else {
      this.listLength = wordList.length;
      this.end = 0;
    }
    // console.log('end', this.end, wordList.length, this.listLength)
  };
}
