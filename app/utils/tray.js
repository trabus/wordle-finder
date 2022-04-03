import { tracked } from '@glimmer/tracking';
import { TrackedArray } from 'tracked-built-ins';
export default class Tray {
  id;
  name;
  group;
  @tracked items;
  @tracked label;

  constructor({ id, label, name, group, items = [] }) {
    this.id = id;
    this.name = name;
    this.label = label;
    this.group = group;
    this.items = new TrackedArray(items);
  }

  get key() {
    return typeof this.id === 'string' ? this.id : `${this.group.substring(0, 1)}${this.id}`;
  }

  clearItems = () => {
    this.setItems([]);
  };
  setItems = (items) => {
    this.items = new TrackedArray(items);
  };

  addItem = (item) => {
    if (!this.items.includes(item)) this.items.push(item);
  };

  removeItem = (item) => {
    if (this.items.includes(item)) return this.items.splice(this.items.indexOf(item), 1);
  };
}
