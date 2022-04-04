import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';

export default class SettingsService extends Service {
  keyboards;
  @tracked keyboard = 'qwerty';
  @tracked useCommon = true;
  @tracked sortAlpha = false;
  @tracked autoExclude = true; //false
  @tracked showLetterInfo = false;
  @tracked showWordInfo = false;
  @tracked selectPlacement = false;

  constructor() {
    super(...arguments);
    this.keyboards = {
      alpha: {
        name: 'alpha',
        value: 'alpha',
        order: 'abcdefghijklmnopqrstuvwxyz',
        values: [],
      },
      azerty: {
        name: 'azerty',
        value: 'azerty',
        order: 'azertyuiopqsdfghjklmwxcvbn',
        values: [],
      },
      qwerty: {
        name: 'qwerty',
        value: 'qwerty',
        order: 'qwertyuiopasdfghjklzxcvbnm',
        values: [],
      },
      dvorak: {
        name: 'dvorak',
        value: 'dvorak',
        order: 'pyfgcrlaoeuidhtnsqjkxbmwvz',
        values: [],
      },
      colemak: {
        name: 'colemak',
        value: 'colemak',
        order: 'qwfpgjluyarstdhneiozxcvbkm',
        values: [],
      },
    };
    // setup values as chars in order
    Object.keys(this.keyboards).forEach((type) => {
      this.keyboards[type].values = this.keyboards[type].order.split('');
    });
  }
  get keyboardTypeOptions() {
    return Object.keys(this.keyboards).map((value) => this.keyboards[value]);
  }
  get keyboardLetters() {
    return [...this.keyboards[this.keyboard].values];
  }
}
