import js from '@eslint/js'
import globals from 'globals'
import globby from 'globby'
// FIXME: Cannot find module
// import reactRecommended from 'eslint-plugin-react/configs/recommended'
// import jsxRuntimeRecommended from 'eslint-plugin-react/configs/jsx-runtime'
import reactHooks from 'eslint-plugin-react-hooks'
import eslintPluginImport from 'eslint-plugin-import'
// import importRecommended from 'eslint-plugin-import/config/recommended'
import eslintConfigPrettier from 'eslint-config-prettier'
import tseslint from 'typescript-eslint'

const projects = globFiles(['**/tsconfig.json', '**/jsconfig.json'])
const tsProjects = projects.filter((x) => x.endsWith('tsconfig.json'))

/**
 * @type {import('eslint').Linter.FlatConfig}
 */
const myConfig = {
  // https://eslint.org/docs/user-guide/configuring#specifying-parser-options
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
    globals: {
      ...globals.browser,
      ...globals.node,
    },
  },

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

const shared = [
  //
  js.configs.recommended,
  // https://www.npmjs.com/package/eslint-plugin-react
  // reactRecommended,
  // jsxRuntimeRecommended,
  // https://www.npmjs.com/package/eslint-plugin-react-hooks
  reactHooks.configs.recommended,
  // https://www.npmjs.com/package/eslint-plugin-import
  eslintPluginImport.configs.recommended,
  // https://github.com/prettier/eslint-config-prettier
  eslintConfigPrettier,
]

console.info(eslintConfigPrettier)

/**
 * @type {import('eslint').Linter.FlatConfig[]}
 */
export default tseslint.config([
  {
    files: ['**/*.{ts,tsx}'],
    extends: [...shared, ...tseslint.configs.recommended],
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: true,
      },
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'error',
      'no-use-before-define': 'off',
      '@typescript-eslint/no-use-before-define': ['error', 'nofunc'],
      '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
  },
  {
    files: ['**/*.{js,jsx,mjs,cjs}'],
    extends: [...shared, tseslint.configs.disableTypeChecked],
  },
])
