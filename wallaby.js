module.exports = function () {
  return {
    files: ['src/**/*.ts', '!src/**/*.{test,spec}.ts'],

    tests: ['**/*.{test,spec}.ts'],

    env: {
      type: 'node',
    },

    testFramework: 'ava',
  };
};
