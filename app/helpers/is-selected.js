import { helper } from '@ember/component/helper';

export default helper(function isSelected(positional /*, named*/) {
  const [option, value] = positional;
  return option === value;
});
