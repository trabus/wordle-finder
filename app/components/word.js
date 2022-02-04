import Component from '@glimmer/component';
import { task, timeout } from 'ember-concurrency';

export default class WordComponent extends Component {
  isShowing = false;
  get wordClass() {
    if (this.isCommon) {
      return 'text-gray-600 font-bold';
    }
    return '';
  }
  get wordData() {
    return this.args.api.wordFinder.wordData.get(this.args.word);
  }
  get isCommon() {
    return this.commonList.includes(this.args.word);
  }
  get commonList() {
    return [...this.args.api.wordFinder.commonList];
  }
  @task
  *showData(show) {
    const { word, api } = this.args;
    if (!show) {
      api.wordFinder.wordInfo = undefined;
      this.isShowing = false;
      this.showData.cancelAll();
      return;
    }
    if (!this.isCommon) return;
    yield timeout(300);
    this.isShowing = true;
    const { wordData } = this;
    const { frequency, ranking } = wordData;
    api.wordFinder.letterInfo = undefined;
    api.wordFinder.wordInfo = show
      ? { word, wordData, frequency, ranking }
      : undefined;
    yield timeout(3500);
    api.wordFinder.wordInfo = undefined;
    this.isShowing = false;
  }
  clickShowData = () => {
    if (this.showData.isRunning) {
      console.log('cancel', this.showData);
      this.showData.cancelAll();
    }
    this.showData.perform(true);
  };
  hoverShowData = (show) => {
    const { api } = this.args;
    if (api.isMobile) return;
    this.showData.perform(show);
  };
  touchShowData = () => {
    const { api } = this.args;
    if (!api.isMobile) return;
    if (this.isShowing) this.showData.cancelAll();
    this.showData.perform(true);
  };
}
