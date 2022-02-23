import words from 'wordle-assist/utils/words';
import WordData from 'wordle-assist/utils/word-data';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { common } from '../../fixtures/words-fixtures';

module('Unit | Utility | words', function (hooks) {
  setupTest(hooks);

  let wordData;
  hooks.before(function () {
    wordData = WordData();
  });
  // TODO: Replace this with your real tests.
  test('it works', function (assert) {
    let result = words(common, wordData);
    assert.ok(result);
  });
});
