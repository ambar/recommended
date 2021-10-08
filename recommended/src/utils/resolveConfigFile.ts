import {promises as fsp} from 'fs'
import path from 'path'

const hasFile = async (file: string) =>
  Boolean(await fsp.stat(file).catch(() => null))

// like `cosmiconfig` but do not read file
export default async function resolveConfigFile(
  packageName: string,
  {
    packageProp = packageName,
    searchPlaces = [],
  }: {packageProp: string; searchPlaces: string[]}
) {
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
