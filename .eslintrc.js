module.exports = {
  parser: '@typescript-eslint/parser',
  extends: ['plugin:@typescript-eslint/recommended', 'prettier', 'plugin:prettier/recommended'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  env: {
    es6: true,
    node: true,
  },
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    'prettier/prettier': 'error',
    '@typescript-eslint/no-empty-function': 'off',
  },
};
