// DEV: We were struggling with JSDeliver + ESM, so hardcoding some `assert` for now
const assert = (val, msg) => {
  if (!val) {
    throw new Error(msg);
  }
};
const assert2 = (val, msg) => {
  if (!val) {
    throw new Error(msg);
  }
};
