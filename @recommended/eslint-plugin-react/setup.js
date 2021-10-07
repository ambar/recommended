const fs = require('fs')
const semver = require('semver')
const pkg = require('./package.json')
const dep = require('eslint-plugin-react/package.json')

if (dep.name === pkg.name) {
  throw new Error('Do not link to the bundled package')
}

const externals = [
  // used by eslint-plugin-react(@2), eslint(@3)
  'doctrine',
  // used by eslint(@5)
  'estraverse',
  'semver',
]

pkg.scripts.build = `node setup && esbuild . --outfile=$npm_package_main --bundle --platform=node ${externals
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
