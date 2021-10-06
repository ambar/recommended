/* eslint-disable no-console */
const fsp = require('fs').promises
const path = require('path')
const globby = require('globby')
const semver = require('semver')
const {command} = require('execa')
const dep = require('eslint/package.json')
const rcPkg = require('@eslint/eslintrc/package.json')
const pkg = require('./package.json')

if (dep.name === pkg.name) {
  throw new Error('Do not link to the bundled package')
}

const externals = [
  ...new Set([
    // shared by plugins
    'doctrine',
    // not using entry point
    '@eslint/eslintrc',
    // shared by eslint & @eslint/eslintrc, ajv, espree, globals, js-yaml, minimatch etc.
    ...Object.keys(rcPkg.dependencies).filter((x) =>
      Object.keys(dep.dependencies).includes(x)
    ),
    // lightweight, or zero dependency
    'chalk',
    'semver',
    'debug',
    'enquirer',
  ]),
]
console.info('externals:', externals)

const bundleDir = '__bundled__'
const babelrc = '.babelrc'
const files = dep.files.filter((x) => x !== 'README.md')
const gitignore = files.concat(bundleDir, babelrc)
const eslintDir = path.dirname(require.resolve('eslint/package.json'))

const main = async () => {
  // Setup package.json
  Object.assign(pkg, {
    bin: dep.bin,
    main: dep.main,
    files: files.concat(bundleDir),
    license: dep.license,
    engines: dep.engines,
    // reset
    dependencies: {},
  })
  // NOTE: increase this number before publish
  const ver = 1
  pkg.version = [...Array(ver).keys()].reduce(
    (acc) => semver.inc(acc, 'prerelease'),
    dep.version
  )
  externals.forEach((x) => {
    if (dep.peerDependencies && x in dep.peerDependencies) {
      pkg.peerDependencies[x] = dep.peerDependencies[x]
    } else if (x in dep.dependencies) {
      pkg.dependencies[x] = dep.dependencies[x]
    } else {
      throw new Error('Invalid external')
    }
  })

  // Copy files
  await Promise.all(
    files.map(async (x) => {
      await fsp.rmdir(x, {recursive: true, force: true})
    })
  )
  const filesToCopy = await globby(files, {cwd: eslintDir})
  console.info('Coping %s files from %s', filesToCopy.length, files)
  await Promise.all(
    filesToCopy.map(async (x) => {
      const dest = path.resolve(__dirname, x)
      await fsp.mkdir(path.dirname(dest), {recursive: true})
      await fsp.copyFile(path.resolve(eslintDir, x), dest)
    })
  )

  // Bundle dependencies
  const aliasConfig = {}
  await fsp.rmdir(bundleDir, {recursive: true, force: true})
  await fsp.mkdir(bundleDir)
  await Promise.all(
    Object.keys(dep.dependencies).map(async (name) => {
      if (!externals.includes(name)) {
        const outfile = path.format({dir: bundleDir, name, ext: '.js'})
        aliasConfig[name] = `./${outfile}`
        console.info('bundle:', name)
        await command(
          `esbuild --platform=node --bundle --outfile=${outfile} ${name} ${externals
            .map((x) => `--external:${x}`)
            .join(' ')}`,
          {stdio: 'inherit'}
        )
      }
    })
  )

  const babelConfig = {plugins: [['module-resolver', {alias: aliasConfig}]]}
  await Promise.all([
    fsp.writeFile(babelrc, JSON.stringify(babelConfig, null, '  ') + '\n'),
    fsp.writeFile('.gitignore', gitignore.join('\n') + '\n'),
    fsp.writeFile('./package.json', JSON.stringify(pkg, null, '  ') + '\n'),
  ])

  // Transform alias, overwrite existing files
  await Promise.all(
    files.map(async (x) => {
      const stat = await fsp.stat(x)
      if (stat.isDirectory()) {
        console.info('transform:', x)
        await command(`babel --out-dir ${x} ${x}`, {stdio: 'inherit'})
      }
    })
  )
}

main()
