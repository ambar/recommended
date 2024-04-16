import myConfig from '@recommended/eslint-config'

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  //
  myConfig,
  {
    ignores: ['/recommended/test/fixtures'],
  },
]
