import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import html2canvas from 'html2canvas';

export default class LetterComponent extends Component {
  @tracked showData;
  get letterBg() {
    const { value } = this.args;
    if (value.from.includes('good')) {
      return 'letter-good-bg';
    }
    return `letter-${value.from}-bg`;
  }
  get letterData() {
    const { wordFinder, value } = this.args;
    return wordFinder.letterList.get(value.name);
  }
  get letterCount() {
    return this.letterData.count;
  }
  get letterFrequency() {
    return this.letterData.frequency.toFixed(2);
  }
  toggleDead = () => {
    const { wordFinder, value } = this.args;
    if (value.from === 'start') {
      wordFinder.updateList('dead', value);
    } else {
      wordFinder.updateList('start', value);
    }
  };
  hoverShowData = (show) => {
    this.showData = show;
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
