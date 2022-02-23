import Component from '@glimmer/component';
import { service } from '@ember/service';
// import { tracked } from '@glimmer/tracking';
import { modifier } from 'ember-modifier';

export default class SettingsComponent extends Component {
  @service settings;
  /**
   * ACTIONS
   */
  selectKeyboard = (e) => {
    this.settings.keyboard = e.target.value;
  };
  toggleSetting = (value, update, e) => {
    this.settings[value] = e.target.checked;
    if (update) this.args.updateSettings();
  };
  setSelected = modifier((element, [value, selected]) => {
    const isSelected = value === selected;
    if (isSelected) element.setAttribute('selected', '');
  });
}
