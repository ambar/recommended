const fs = require('fs')
const semver = require('semver')
const pkg = require('./package.json')
const dep = require('eslint-plugin-import/package.json')

if (dep.name === pkg.name) {
  throw new Error('Do not link to the bundled package')
}

const dynamic = [
  // dynamic required
  'typescript',
]

const externals = [
  // dynamic required, peer
  'eslint',
  // used by eslint-import-resolver-typescript
  'tsconfig-paths',
  // used by eslint-plugin-react(@2), eslint(@3)
  'doctrine',
  // v3 (should upgrade), used by eslint(@4), resolver-typescript(@4), @typescript-eslint(@4)
  'debug',
]

pkg.scripts.build = `node setup && esbuild . --outfile=$npm_package_main --bundle --platform=node ${dynamic
  .concat(externals)
  .map((x) => `--external:${x}`)
  .join(' ')}`

Object.assign(pkg, {dependencies: {}, peerDependencies: dep.peerDependencies})
externals.forEach((x) => {
  if (x in dep.peerDependencies) {
    pkg.peerDependencies[x] = dep.peerDependencies[x]
  } else if (x in dep.dependencies) {
    pkg.dependencies[x] = dep.dependencies[x]
  } else {
    throw new Error('Invalid external')
  }
})

// NOTE: increase this number before publish
const ver = 2
pkg.version = [...Array(ver).keys()].reduce(
  (acc) => semver.inc(acc, 'prerelease'),
  dep.version
)

fs.writeFileSync('./package.json', JSON.stringify(pkg, null, '  ') + '\n')
