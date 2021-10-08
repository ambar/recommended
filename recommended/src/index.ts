/* eslint-disable no-console */
import * as fs from 'fs'
import * as path from 'path'
import mri from 'mri'
import debug from 'debug'
import globby from 'globby'
import prettier from 'prettier'
import kleur from 'kleur'
import execa, {ExecaError} from 'execa'
import {runInit} from './runInit'
import findCacheDir from './utils/findCacheDir'

const NAME = 'recommended'
const log = debug(NAME)
const defaultIgnore = [
  '**/node_modules/**',
  '**/.git',
  '**/lerna.json',
  '**/package.json',
  '**/package-lock.json',
  '**/CHANGELOG.md',
]
const resolveRoot = path.resolve.bind(null, __dirname, '..')
const globFiles = (patterns: string | string[]) =>
  globby(patterns, {dot: true, gitignore: true, ignore: defaultIgnore})
const hasFile = async (file: string) =>
  Boolean(await fs.promises.stat(file).catch(() => null))

// like cosmiconfig but do not read file
const resolveConfigFile = async (
  packageName: string,
  {
    packageProp = packageName,
    searchPlaces = [],
  }: {packageProp: string; searchPlaces: string[]}
) => {
  for (const file of searchPlaces) {
    if (await hasFile(file)) {
      if (file === 'package.json') {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const pkg = require(path.resolve(file)) as Record<string, unknown>
        if (pkg[packageProp]) {
          return file
        }
      } else {
        return file
      }
    }
  }
  return null
}

const jsExts = ['.js', '.jsx', '.cjs', '.mjs']
const tsExts = ['.ts', '.tsx']
const prettierExts = [
  ...jsExts,
  ...tsExts,
  '.json',
  '.css',
  '.md',
  '.mdx',
  '.yml',
  '.yaml',
]

const toArgv = (obj: Record<string, unknown>) => {
  return Object.entries(obj)
    .map(([k, v]) => {
      if (typeof v === 'boolean') {
        return v ? `--${k}` : `--no-${k}`
      } else if (typeof v !== 'undefined') {
        return [`--${k}`, v]
      }
    })
    .filter(Boolean)
    .flat() as string[]
}

const runPrettier = async (files: string[], {fix = false}) => {
  const name = 'prettier'
  log('runPrettier:resolveConfigFile:start')
  // https://prettier.io/docs/en/configuration.html
  const configFile = await prettier.resolveConfigFile().catch(() => null)

  const argv = toArgv({
    config: configFile || require.resolve('@recommended/prettier-config'),
    write: fix || undefined,
    check: !fix || undefined,
  })
  log('runPrettier:resolveConfigFile:ok', argv.join(' '))

  log('runPrettier:start')
  await execa(name, [...argv, ...files], {
    stdio: 'inherit',
    preferLocal: true,
    localDir: resolveRoot('node_modules'),
  }).finally(() => {
    log('runPrettier:complete')
  })
}

const runESLint = async (files: string[], {fix = false, cache = true}) => {
  const name = 'eslint'
  log('runESLint:resolveConfigFile:start')
  const configFile = await resolveConfigFile(name, {
    packageProp: 'eslintConfig',
    // see https://eslint.org/docs/user-guide/configuring/configuration-files#configuration-file-formats
    searchPlaces: [
      ...['', '.js', '.yaml', '.yml', '.json'].map((x) => `.${name}rc${x}`),
      'package.json',
    ],
  })
  const cacheDir = cache ? await findCacheDir(NAME) : undefined
  const argv = toArgv({
    config: configFile || require.resolve('@recommended/eslint-config'),
    fix: fix || undefined,
    cache,
    'cache-location': cacheDir && path.join(cacheDir, '/'),
    'resolve-plugins-relative-to': path.dirname(
      require.resolve('@recommended/eslint-config/package.json')
    ),
  })
  log('runESLint:resolveConfigFile:ok', argv.join(' '))

  log('runESLint:start')
  await execa(name, [...argv, ...files], {
    stdio: 'inherit',
    preferLocal: true,
    localDir: resolveRoot('node_modules'),
  }).finally(() => {
    log('runESLint:complete')
  })
}

const usage = `
Usage: recommended [options] [files]

Options:
  --fix\t\tautomatically fix problems
  --cache\ttry to use disk cache to speed up - default: true
  --init\tsetup editor config files
  -h, --help\toutput usage information

Examples:
  ${kleur.gray('# lint all files in the current project')}
  recommended
  ${kleur.gray('# lint specified files')}
  recommended src/index.ts
`

export const run = async (argv: string[]) => {
  const args = mri<{
    cache: boolean
    fix: boolean
    init: boolean
    help: boolean
  }>(argv, {
    boolean: ['fix', 'cache', 'help'],
    alias: {h: 'help'},
  })
  log('main', args)

  const {fix, cache, help, init} = args
  if (help) {
    console.log(usage)
    return
  }

  if (init) {
    await runInit()
    return
  }

  let files = args._
  if (files.length) {
    files = await globFiles(files)
    log(`globFiles:filtered (${files.length})`, files)
  } else {
    // pattern[] is slower
    const uniqueExts = [...new Set([...jsExts, ...tsExts, ...prettierExts])]
    files = await globFiles(
      `**/*.{,${uniqueExts.map((x) => x.replace(/^\./, '')).join(',')}}`
    )
    log(`globFiles (${files.length})`, files)
  }
  if (!files.length) {
    log(`No matching files`)
    return
  }

  try {
    const prettierFiles = files.filter((x) =>
      prettierExts.some((e) => x.endsWith(e))
    )
    await runPrettier(prettierFiles, {fix})
    const hasTS = (await globFiles('**/tsconfig.json')).length > 0
    const esLintFiles = files.filter((x) =>
      (hasTS ? tsExts.concat(jsExts) : jsExts).some((e) => x.endsWith(e))
    )
    await runESLint(esLintFiles, {fix, cache})
  } catch (e) {
    // errors from ESLint or Prettier
    if ((e as ExecaError).exitCode) {
      process.exit((e as ExecaError).exitCode)
    }
    // other unknown errors
    console.error((e as Error)?.message ?? e)
    process.exit(1)
  }
}
