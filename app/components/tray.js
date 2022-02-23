import Component from '@glimmer/component';

export default class TrayComponent extends Component {
  get letters() {
    const { api, id } = this.args;
    return api.wordFinder.positions.get(id);
  }
}
