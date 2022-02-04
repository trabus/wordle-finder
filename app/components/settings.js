import Component from '@glimmer/component';
// import { tracked } from '@glimmer/tracking';
import { modifier } from 'ember-modifier';

export default class SettingsComponent extends Component {
  get wordFinder() {
    return this.args.wordFinder;
  }
  /**
   * ACTIONS
   */
  selectKeyboard = (e) => {
    this.wordFinder.keyboard = e.target.value;
  };
  toggleSetting = (value, update, e) => {
    this.wordFinder[value] = e.target.checked;
    if (update) this.args.updateSettings();
  };
  setSelected = modifier((element, [value, selected]) => {
    const isSelected = value === selected;
    if (isSelected) element.setAttribute('selected', '');
  });
}
