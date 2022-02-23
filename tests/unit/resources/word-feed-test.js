import WordFeed from 'wordle-assist/resources/word-feed';
import { tracked } from '@glimmer/tracking';
import { useResource } from 'ember-resources';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { waitUntil } from '@ember/test-helpers';
import { later } from '@ember/runloop';

module('Unit | Resources | word-feed', function (hooks) {
  setupTest(hooks);
  test('it works', async function (assert) {
    class Context {
      @tracked wordList = [];
      @tracked displayCount = 0;
    }
    let ctx = new Context();
    ctx.wordList = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven'];
    ctx.displayCount = 6;
    let result = useResource(this.owner, WordFeed, () => [
      ctx.wordList,
      ctx.displayCount,
    ]);
    assert.ok(result.value);
    assert.strictEqual(result.value.length, 0);
    // console.log(result)
    await later(() => {
      // ctx.wordList = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven'];
      // ctx.displayCount = 6;
    }, 500);
    await waitUntil(
      () => {
        return result.value.length > 0;
      },
      { timeout: 1000 }
    );
    assert.strictEqual(result.value.length, 3);
  });
});
