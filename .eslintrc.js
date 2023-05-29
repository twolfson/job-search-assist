module.exports = {
  // Inherit from our package
  extends: [
    "prettier"
  ],

  // Configure our environment
  // http://eslint.org/docs/user-guide/configuring#specifying-environments
  env: {
    browser: true,
    es2022: true,
  }
};
