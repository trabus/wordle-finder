import { tracked } from '@glimmer/tracking';
export default class Letter {
  #name;
  #history;
  @tracked locations;
  @tracked auto = false;

  constructor(letter) {
    this.#name = letter;
    // location defines current tray(s) letter is in. always starts in 's'
    // the only case where there can be more than one is when
    // the trays are both good letters, to allow for duplicates
    this.locations = ['s'];
    this.#history = ['s'];
  }
  get location() {
    return this.locations.length > 1
      ? [...this.locations]
      : this.locations.join('');
  }
  // allows duplicates if all existing locations are in the good group
  set location(val) {
    const good = val.match(/(g)([0-9])/) && this.goodLocation;
    if (good) {
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
  get name() {
    return this.#name;
  }
  set name(val) {
    this.#name = val;
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
