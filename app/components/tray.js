import Component from '@glimmer/component';
export default class TrayComponent extends Component {
  get letters() {
    const { api, id } = this.args;
    return api.wordFinder.positions.get(id);
  }
  get classes() {
    const { settings } = this.args.api;
    return settings.colorContrast ? ' color-contrast' : '';
  }
}
