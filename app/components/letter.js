import Component from '@glimmer/component';
import html2canvas from 'html2canvas';
import { task, timeout } from 'ember-concurrency';

export default class LetterComponent extends Component {
  isShowing = false;
  get letterBg() {
    const { value } = this.args;
    if (value.from.includes('good')) {
      return 'bg-letter-good';
    }
    return `bg-letter-${value.from}`;
  }
  get isDraggable() {
    const { value } = this.args;
    return value.from !== 'dead';
  }
  // TODO: turn letterData into delegate class to collect letterInfo into one place
  get letterData() {
    const { api, value } = this.args;
    return api.wordFinder.letterList.get(value.name);
  }
  get letterCount() {
    return this.letterData.count;
  }
  get letterFrequency() {
    return this.letterData.frequency.toFixed(2);
  }
  @task
  *showData(show) {
    const { api, value } = this.args;
    if (!show) {
      if (!this.isShowing) this.showData.cancelAll();
      yield timeout(2000);
      api.wordFinder.letterInfo = undefined;
      this.isShowing = false;
      this.showData.cancelAll();
      return;
    }
    // if (this.showData.isRunning) this.showData.cancelAll();
    yield timeout(400);
    this.isShowing = true;
    const { letterFrequency, letterData, letterCount } = this;
    const data = show
      ? { letter: value.name, letterData, letterCount, letterFrequency }
      : undefined;
    api.wordFinder.wordInfo = undefined;
    api.wordFinder.letterInfo = data;
    return data;
  }
  hoverShowData = (show) => {
    const { api } = this.args;
    if (api.isMobile) return;
    this.showData.perform(show);
  };
  touchShowData = (show) => {
    const { api } = this.args;
    if (!api.isMobile) return;
    this.showData.perform(show);
  };

  dragStartHook = (e) => {
    // console.log(e);
    html2canvas(e.target).then((canvas) => {
      canvas.globalAlpha = 0.5;
      e.dataTransfer.dropEffect = 'move';
      e.dataTransfer.setDragImage(
        canvas,
        e.target.clientWidth,
        e.target.clientHeight
      );
    });
  };
  dragEndHook = (/*e*/) => {
    // console.log(e);
  };
}
