import path from 'path'
import escalade from 'escalade'

export default async function findCacheDir(name: string) {
  const pkg = await escalade(process.cwd(), (_, names) => {
    if (names.includes('package.json')) {
      return 'package.json'
    }
  })
  if (pkg) {
    return path.resolve(path.dirname(pkg), 'node_modules', '.cache', name)
  }
}
