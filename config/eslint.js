const globby = require('globby')

const hasPrettier = safeGet(() => !!require.resolve('prettier'), false)
const projects = globFiles(['**/tsconfig.json', '**/jsconfig.json'])
const tsProjects = projects.filter((x) => x.endsWith('tsconfig.json'))

/**
 * @type {import('eslint').Linter.BaseConfig}
 */
module.exports = {
  // https://eslint.org/docs/user-guide/configuring#specifying-parser-options
  parserOptions: {
    ecmaVersion: 2019,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },

  // https://eslint.org/docs/user-guide/configuring/language-options#specifying-environments
  env: {
    browser: true,
    node: true,
    es6: true,
    jest: true,
  },

  overrides: tsProjects.length
    ? [
        {
          files: ['**/*.ts', '**/*.tsx'],
          parser: '@typescript-eslint/parser',
          plugins: ['@typescript-eslint'],
          parserOptions: {
            project: tsProjects,
          },
          extends: [
            // https://www.npmjs.com/package/@typescript-eslint/eslint-plugin
            'plugin:@typescript-eslint/recommended',
            'plugin:@typescript-eslint/recommended-requiring-type-checking',
            // NOTE: To override other configs, Prettier must be the last extension
            hasPrettier && 'prettier',
          ].filter(Boolean),
          rules: {
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': 'error',
            'no-use-before-define': 'off',
            '@typescript-eslint/no-use-before-define': ['error', 'nofunc'],
            '@typescript-eslint/explicit-module-boundary-types': 'off',
          },
        },
      ]
    : [],

  // recommended for all, :D
  extends: [
    // https://eslint.org/docs/rules/
    'eslint:recommended',
    // https://www.npmjs.com/package/eslint-plugin-react
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    // https://www.npmjs.com/package/eslint-plugin-react-hooks
    'plugin:react-hooks/recommended',
    // https://www.npmjs.com/package/eslint-plugin-import
    'plugin:import/recommended',
    // NOTE: To override other configs, Prettier must be the last extension
    // https://github.com/prettier/eslint-plugin-prettier
    hasPrettier && 'prettier',
  ].filter(Boolean),

  rules: {
    // recommended
    'no-use-before-define': ['error', 'nofunc'],
    'no-var': 'error',
    'prefer-const': ['error', {destructuring: 'all'}],
    'no-console': 'error',

    // react
    'react/display-name': 'off',
    'react/prop-types': 'off',

    // react hooks
    'react-hooks/exhaustive-deps': 'error',
  },

  settings: {
    // https://www.npmjs.com/package/eslint-plugin-react#configuration
    react: {
      version: safeGet(() => !!require.resolve('react'), false)
        ? 'detect'
        : '17',
    },

    'import/resolver': {
      // support: 1) ts/tsx extensions; 2) alias in tsconfig/jsconfig
      // https://www.npmjs.com/package/eslint-import-resolver-typescript
      typescript: {
        alwaysTryTypes: true,
        project: projects,
      },
    },
  },
}

function safeGet(fn, defaultValue) {
  try {
    return fn()
  } catch (_) {
    return defaultValue
  }
}

function globFiles(pattern) {
  return globby.sync(pattern, {
    gitignore: true,
    ignore: ['**/node_modules/**', '**/.git'],
  })
}
