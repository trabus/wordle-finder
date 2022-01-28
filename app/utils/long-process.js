import { Yieldable } from 'ember-concurrency';

class LongProcessYieldable extends Yieldable {
  onYield(state) {
    let callbackId = requestIdleCallback(() => state.next());

    return () => cancelIdleCallback(callbackId);
  }
}

export const longProcess = () => new LongProcessYieldable();

export default longProcess;
