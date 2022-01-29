import Component from '@glimmer/component';
// import { tracked } from '@glimmer/tracking';
import { modifier } from 'ember-modifier';

export default class SettingsComponent extends Component {
  get wordFinder() {
    return this.args.wordFinder;
  }
  get showModal() {
    return this.args.showModal;
  }
  /**
   * ACTIONS
   */
  selectKeyboard = (e) => {
    this.wordFinder.keyboard = e.target.value;
  };
  toggleCommon = (e) => {
    this.wordFinder.useCommon = e.target.checked;
    this.wordFinder.updateSettings();
  };
  toggleAlpha = (e) => {
    this.wordFinder.sortAlpha = e.target.checked;
    this.wordFinder.updateSettings();
  };
  toggleWordInfo = (e) => {
    this.wordFinder.showWordInfo = e.target.checked;
  };
  toggleLetterInfo = (e) => {
    this.wordFinder.showLetterInfo = e.target.checked;
  };
  setSelected = modifier((element, [value, selected]) => {
    const isSelected = value === selected;
    if (isSelected) element.setAttribute('selected', '');
  });
}
