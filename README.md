# `recommended`

[![Coverage Status](https://coveralls.io/repos/github/ambar/recommended/badge.svg?branch=main)](https://coveralls.io/github/ambar/recommended?branch=main)
[![npm version](https://badgen.net/npm/v/recommended)](https://www.npmjs.com/package/recommended)

Run Prettier/ESLint with _**recommended**_ configs.

- Simple, no config (but configurable), if not specified, the default config will be used:
  - [`eslint:recommended`](https://eslint.org/docs/rules/)
  - [`plugin:import/recommended`](https://www.npmjs.com/package/eslint-plugin-import)
  - [`plugin:react/recommended`](https://www.npmjs.com/package/eslint-plugin-react)
  - [`plugin:react-hooks/recommended`](https://www.npmjs.com/package/eslint-plugin-react-hooks)
  - [`plugin:@typescript-eslint/recommended`](https://www.npmjs.com/package/@typescript-eslint/eslint-plugin)
  - [`plugin:@typescript-eslint/recommended-requiring-type-checking`](https://www.npmjs.com/package/@typescript-eslint/eslint-plugin)
- Prettier is integrated by default
- Support JSX/TypeScript by default
- Automatically exclude files in gitignore
- Automatically add aliases (defined by [`paths`](https://www.typescriptlang.org/tsconfig#paths) in tsconfig and jsconfig)

## Install

```bash
# JavaScript only
npm install --save-dev recommended
# JavaScript and TypeScript
npm install --save-dev recommended typescript
```

## CLI

```bash
Usage: recommended [options] [files]

Options:
  --fix		automatically fix problems
  --cache	try to use disk cache to speed up - default: true
  --init	setup editor config files
  -h, --help	output usage information

Examples:
  # lint all files in the current project
  recommended
  # lint specified files
  recommended src/index.ts
```

```JSON
{
  "scripts": {
    "lint": "recommended",
    "lint:fix": "recommended --fix"
  }
}
```

## Editor Integration

Set up the config (.rc or VSCode) files by `init` command:

```bash
recommended --init
```
