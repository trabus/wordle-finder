import Component from '@glimmer/component';

export default class TrayComponent extends Component {
  get letters() {
    const { api, id, letters } = this.args;
    return letters || api.wordFinder.trays.get(id).items;
  }
}
