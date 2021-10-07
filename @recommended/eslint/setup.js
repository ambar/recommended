/* eslint-disable no-console */
const fsp = require('fs').promises
const assert = require('assert')
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

// NOTE: increase this number before publish
const ver = 3
pkg.version = [...Array(ver).keys()].reduce(
  (acc) => semver.inc(acc, 'prerelease'),
  dep.version
)

const externals = new Set([
  // shared by plugins
  'doctrine',
  // not using entry point
  'ajv',
  // dynamic require
  'espree',
  // lightweight, or zero dependency
  'chalk',
  'semver',
  'debug',
  'enquirer',
])
console.info('externals:', externals)

const bundleDir = '__bundled__'
const rcDir = '__rc__'
const babelrc = '.babelrc'
const files = dep.files.filter((x) => x !== 'README.md')
const gitignore = files.concat(babelrc, bundleDir, rcDir)

const copyPkg = async (name, {dir, files}) => {
  const target = `${name}/package.json`
  const fromPkg = require(target)
  const from = path.dirname(require.resolve(target))
  await fsp.mkdir(dir, {recursive: true})

  // Copy files
  files = files || fromPkg.files
  await Promise.all(
    files.map(async (x) => {
      const dest = path.resolve(__dirname, dir, x)
      await fsp.rmdir(dest, {recursive: true, force: true})
    })
  )
  const filesToCopy = await globby(files, {cwd: from})
  console.info('Coping %s files from %s %s', filesToCopy.length, name, files)
  await Promise.all(
    filesToCopy.map(async (x) => {
      const dest = path.resolve(__dirname, dir, x)
      await fsp.mkdir(path.dirname(dest), {recursive: true})
      await fsp.copyFile(path.resolve(from, x), dest)
    })
  )

  const pkgFile = path.resolve(dir, 'package.json')
  if (!(await fsp.stat(pkgFile).catch(() => null))) {
    await fsp.writeFile(
      pkgFile,
      JSON.stringify({
        private: true,
        main: fromPkg.main,
        bin: fromPkg.bin,
      })
    )
  }
}

const main = async () => {
  // Setup package.json
  Object.assign(pkg, {
    bin: dep.bin,
    main: dep.main,
    files: files.concat(bundleDir, rcDir),
    license: dep.license,
    engines: dep.engines,
    // reset
    dependencies: {},
  })
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
  await copyPkg('eslint', {dir: '.', files})

  // Bundle dependencies
  const aliasConfig = {}
  await fsp.rmdir(bundleDir, {recursive: true, force: true})
  await fsp.mkdir(bundleDir)
  const itsDeps = Object.keys(dep.dependencies)
  const rcDeps = Object.keys(rcPkg.dependencies)
  const theExternals = ['@eslint/eslintrc', ...externals]
  await Promise.all(
    [...new Set(itsDeps.concat(rcDeps))].map(async (name) => {
      if (!theExternals.includes(name)) {
        const outfile = path.format({dir: bundleDir, name, ext: '.js'})
        aliasConfig[name] = `./${outfile}`
        console.info('bundle:', name)
        await command(
          `esbuild --platform=node --bundle --outfile=${outfile} ${name} ${theExternals
            .map((x) => `--external:${x}`)
            .join(' ')}`,
          {stdio: 'inherit'}
        )
      }
    })
  )

  // Setup `@eslint/eslintrc`
  await fsp.rmdir(rcDir, {recursive: true, force: true})
  await fsp.mkdir(rcDir)
  await copyPkg('@eslint/eslintrc', {dir: rcDir})
  aliasConfig['@eslint/eslintrc'] = `./${rcDir}`

  const babelConfig = {plugins: [['module-resolver', {alias: aliasConfig}]]}
  await Promise.all([
    fsp.writeFile(babelrc, JSON.stringify(babelConfig, null, '  ') + '\n'),
    fsp.writeFile('.gitignore', gitignore.join('\n') + '\n'),
    fsp.writeFile('./package.json', JSON.stringify(pkg, null, '  ') + '\n'),
  ])

  // Transform alias, overwrite existing files
  const pathToAlias = [
    ...files,
    // Transform rc
    ...rcPkg.files.map((x) => path.join(rcDir, x)),
  ]
  await Promise.all(
    pathToAlias.map(async (x) => {
      const stat = await fsp.stat(x)
      if (stat.isDirectory()) {
        console.info('transform:', x)
        await command(`babel --config-file ./.babelrc --out-dir ${x} ${x}`, {
          stdio: 'inherit',
        })
      }
    })
  )

  await command(`node ${pkg.bin.eslint} -v`, {stdio: 'inherit'})
  assert.ok('doctrine' in pkg.dependencies)
  assert.ok(!('@eslint/eslintrc' in pkg.dependencies))
  assert.ok(String(await fsp.readFile(pkg.bin.eslint)).includes(bundleDir))
  assert.ok(
    String(
      await fsp.readFile(path.resolve(rcDir, 'conf/environments.js'))
    ).includes(bundleDir)
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
