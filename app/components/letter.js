import Component from '@glimmer/component';
import html2canvas from 'html2canvas';
import { cached } from '@glimmer/tracking';
const locations = {
  g: 'match',
  b: 'included',
  d: 'excluded',
  s: 'unselected',
};
export default class LetterComponent extends Component {
  isShowing = false;
  get value() {
    const { api, value } = this.args;
    return api.wordFinder.words.letterData.get(value);
  }
  @cached
  get from() {
    return Array.isArray(this.value.location) ? this.value.location[0] : this.value.location;
  }
  get location() {
    const match = this.from.match(/([a-z])([0-9])/);
    const key = match ? match[1] : this.from;
    return locations[key];
  }

  get autoExcluded() {
    const { wordFinder, settings } = this.args.api;
    return settings.autoExclude ? wordFinder.shouldExcludeLetters.includes(this.value.name) : false;
  }

  get letterBg() {
    const match = this.from.match(/([a-z])([0-9])/);
    const { settings } = this.args.api;
    if (match) {
      return `bg-letter-${match[1]}${settings.colorContrast ? ' color-contrast' : ''}`;
    }
    return `bg-letter-${this.from}${this.autoExcluded ? ' autoExcluded' : ''}`;
  }
  get isDraggable() {
    return !this.from.includes('d') && !this.autoExcluded;
  }
  get showSelected() {
    return this.value.isSelected && this.args.trayId === 's';
  }
  handleClick = (e) => {
    e.stopPropagation();
    this.args.handleClick(this.value, e);
  };

  // TODO: turn letterData into delegate class to collect letterInfo into one place
  // get letterData() {
  //   const { api, value } = this.args;
  //   return api.wordFinder.letterData.get(value.name);
  // }
  // get letterCount() {
  //   return this.letterData.count;
  // }
  // get letterFrequency() {
  //   return this.letterData.frequency.toFixed(2);
  // }
  // @task
  // *showData(show) {
  //   const { api, value } = this.args;
  //   if (!show) {
  //     if (!this.isShowing) this.showData.cancelAll();
  //     yield timeout(2000);
  //     api.wordFinder.letterInfo = undefined;
  //     this.isShowing = false;
  //     this.showData.cancelAll();
  //     return;
  //   }
  //   // if (this.showData.isRunning) this.showData.cancelAll();
  //   yield timeout(400);
  //   this.isShowing = true;
  //   const { letterFrequency, letterData, letterCount } = this;
  //   const data = show
  //     ? { letter: value.name, letterData, letterCount, letterFrequency }
  //     : undefined;
  //   api.wordFinder.wordInfo = undefined;
  //   api.wordFinder.letterInfo = data;
  //   return data;
  // }
  // hoverShowData = (show) => {
  //   const { api } = this.args;
  //   if (api.isMobile) return;
  //   this.showData.perform(show);
  // };
  // touchShowData = (show) => {
  //   const { api } = this.args;
  //   if (!api.isMobile) return;
  //   this.showData.perform(show);
  // };

  dragStartHook = (e) => {
    if (this.args.api.wordFinder.tooManyFoundLetters) {
      e.target.setAttribute('draggable', false);
    }
    html2canvas(e.target).then((canvas) => {
      canvas.globalAlpha = 0.5;
      e.dataTransfer.dropEffect = 'move';
      e.dataTransfer.setDragImage(canvas, e.target.clientWidth, e.target.clientHeight);
    });
  };
  dragEndHook = (e) => {
    e.target.setAttribute('draggable', true);
  };
}
