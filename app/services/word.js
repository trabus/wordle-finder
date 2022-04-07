import Service from '@ember/service';
import WordList from '../utils/word-list';
import WordData from '../utils/word-data';
import Words from '../utils/words';
import Finder from '../utils/finder';
import { tracked } from '@glimmer/tracking';
import { task, timeout } from 'ember-concurrency';

export default class WordService extends Service {
  @tracked words;
  @tracked finder;

  constructor() {
    super();
  }

  @task
  *initWordFinder(settings, controls) {
    const wordList = WordList().words;
    const wordData = WordData();
    yield timeout(100);
    const words = new Words({ wordList, wordData, settings, controls });
    this.words = words;
    this.finder = new Finder({ words, settings, controls });
  }
}
