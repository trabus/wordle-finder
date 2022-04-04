import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';

export default class ControlService extends Service {
  @tracked selectedTile;
  constructor() {
    super();
  }

  deselectTile = () => {
    this.selectedTile = null;
  };
  selectTile = (letter) => {
    if (this.selectedTile === letter) {
      this.deselectTile();
    } else {
      this.selectedTile = letter;
    }
  };
  placeTile = (handler) => {
    if (this.selectedTile && handler) {
      handler(this.selectedTile);
      this.deselectTile();
    }
  };
}
