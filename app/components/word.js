import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

export default class WordComponent extends Component {
  @tracked showData;
  get wordClass() {
    if (this.isCommon) {
      return 'text-gray-600 font-bold';
    }
    return '';
  }
  get wordData() {
    return this.args.wordFinder.wordData.get(this.args.word);
  }
  get isCommon() {
    return this.commonList.includes(this.args.word);
  }
  get commonList() {
    return [...this.args.wordFinder.commonList];
  }
  hoverShowData = (show) => {
    if (!this.isCommon) return;
    this.showData = show;
  };
}
