const fs = require('fs')
const pkg = require('./package.json')
const dep = require('eslint-plugin-import/package.json')

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
  // used by eslint-plugin-react(@3), eslint(@3)
  'minimatch',
  // v3 (should upgrade), used by eslint(@4), resolver-typescript(@4), @typescript-eslint(@4)
  'debug',
]

pkg.scripts.build = `esbuild . --outfile=$npm_package_main --bundle --platform=node ${dynamic
  .concat(externals)
  .map((x) => `--external:${x}`)
  .join(' ')}`

externals.forEach((x) => {
  if (x in dep.peerDependencies) {
    pkg.peerDependencies[x] = dep.peerDependencies[x]
  } else if (x in dep.dependencies) {
    pkg.dependencies[x] = dep.dependencies[x]
  } else {
    throw new Error('Invalid external')
  }
})

pkg.version = dep.version + '00'
Object.assign(pkg.peerDependencies, dep.peerDependencies)

fs.writeFileSync('./package.json', JSON.stringify(pkg, null, '  ') + '\n')
