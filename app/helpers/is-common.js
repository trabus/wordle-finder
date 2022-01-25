import { helper } from '@ember/component/helper';

export default helper(function isCommon(positional /*, named*/) {
  const [commonList, word] = positional;
  return commonList.includes(word);
});
