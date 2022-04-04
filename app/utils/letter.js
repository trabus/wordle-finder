import { tracked } from '@glimmer/tracking';
export default class Letter {
  #name;
  #history;
  @tracked controls;
  @tracked settings;
  @tracked locations;

  constructor(letter, { settings = {}, controls = {} }) {
    this.#name = letter;
    // location defines current tray(s) letter is in. always starts in 's'
    // the only case where there can be more than one is when
    // the trays are both good letters, to allow for duplicates
    this.locations = ['s'];
    this.#history = ['s'];
    this.controls = controls;
    this.settings = settings;
  }
  get location() {
    return this.locations.length > 1 ? [...this.locations] : this.locations.join('');
  }
  // allows duplicates if all existing locations are in the good group
  set location(val) {
    const good = val.match(/(g)([0-9])/) && this.goodLocation;
    const bad = val.match(/(b)([0-9])/) && this.badLocation;
    if (good || bad) {
      this.locations = [...this.locations, val];
    } else {
      this.locations = [val];
    }
  }
  // all locations are in the good group
  get goodLocation() {
    return (
      this.locations.filter((location) => {
        return location.match(/(g)([0-9])/);
      }).length === this.locations.length
    );
  }
  get badLocation() {
    return (
      this.locations.filter((location) => {
        return location.match(/(b)([0-9])/);
      }).length === this.locations.length
    );
  }
  get name() {
    return this.#name;
  }
  set name(val) {
    this.#name = val;
  }
  get isSelected() {
    return this.settings.selectPlacement && this.controls?.selectedTile === this.name;
  }
  removeLocation(location) {
    if (this.locations.includes(location))
      return this.locations.splice(this.locations.indexOf(location), 1);
  }
  reset() {
    this.locations = ['s'];
  }

  // #counts;
  // this.#counts = {all: 0, common: 0};
  // @cached
  // get count() {
  //   return this.#counts.all;
  // }
  // get commonCount() {
  //   return this.#counts.common;
  // }
}
