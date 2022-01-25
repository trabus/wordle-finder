import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import html2canvas from 'html2canvas';

export default class LetterComponent extends Component {
  @tracked showData;
  get letterBg() {
    const { trayId, value } = this.args;
    if (trayId.includes('good')) {
      return 'letter-good-bg';
    }
    const bg = value.from.includes('dead') ? 'dead' : trayId;
    return `letter-${bg}-bg`;
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
    const { wordFinder, trayId, value } = this.args;
    if (value.from === 'startLetters') {
      wordFinder.updateList('deadLetters', value);
    } else {
      wordFinder.updateList('startLetters', value);
    }
    const to = `${trayId}Letters`;
    console.log(to, value);
  };
  hoverShowData = (show, e) => {
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
