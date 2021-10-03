/* eslint-disable no-console */
import fs from 'fs'
import path from 'path'
import prompts from 'prompts'
import kleur from 'kleur'
import {merge} from './jsonc'

const fsp = fs.promises
const resolveRoot = path.resolve.bind(null, __dirname, '..')
const relativeCwd = path.relative.bind(null, process.cwd())
const hasFile = async (file: string) =>
  Boolean(await fsp.stat(file).catch(() => null))

const eslintrcText = `
module.exports = {
  extends: [require.resolve('recommended/config/eslint')],
}
`.trimStart()

const prettierrcText = `
module.exports = require('recommended/config/prettier')
`.trimStart()

if (process.env.NODE_ENV === 'test') {
  kleur.enabled = false
}

type PromptResult = {
  filesToAdd: ('rc' | 'vscode')[]
  rmEslintrc: boolean
  rmPrettierrc: boolean
}

export const runInit = async ({answers}: {answers?: PromptResult} = {}) => {
  const eslintrc = '.eslintrc.js'
  const prettierrc = '.prettierrc.js'
  // test only, will be removed after building
  if (process.env.NODE_ENV === 'test' && answers) {
    prompts.inject([answers.filesToAdd])
  }
  const {filesToAdd} = (await prompts(
    [
      {
        type: 'multiselect',
        name: 'filesToAdd',
        message: 'Choose what files to add',
        choices: [
          {
            title: `Add config files (${eslintrc}, ${prettierrc})`,
            value: 'rc',
            selected: true,
          },
          {
            title: 'Add VSCode files (settings.json, extension.json)',
            value: 'vscode',
            selected: true,
          },
        ],
      },
    ],
    {onCancel: () => process.exit()}
  )) as PromptResult

  if (filesToAdd.includes('rc')) {
    let shouldAddEslintrc = true
    if (await hasFile(eslintrc)) {
      if (process.env.NODE_ENV === 'test' && answers) {
        prompts.inject([answers.rmEslintrc])
      }
      const {rmEslintrc} = (await prompts({
        type: 'confirm',
        name: 'rmEslintrc',
        message: `Should overwrite ${eslintrc}?`,
      })) as PromptResult
      if (!rmEslintrc) {
        shouldAddEslintrc = false
        console.info(
          `Skip adding ${eslintrc}, it's recommended to add by yourself:\n`
        )
        console.info(kleur.gray(eslintrcText))
      }
    }
    if (shouldAddEslintrc) {
      await fsp.writeFile(eslintrc, eslintrcText)
      console.info(kleur.green('success'), `Added ${eslintrc}`)
    }

    let shouldAddPrettierrc = true
    if (await hasFile(prettierrc)) {
      if (process.env.NODE_ENV === 'test' && answers) {
        prompts.inject([answers.rmPrettierrc])
      }
      const {rmPrettierrc} = (await prompts({
        type: 'confirm',
        name: 'rmPrettierrc',
        message: `Should overwrite ${prettierrc}?`,
      })) as PromptResult
      if (!rmPrettierrc) {
        shouldAddPrettierrc = false
        console.info(
          `Skip adding ${prettierrc}, it's recommended to add by yourself:\n`
        )
        console.info(kleur.gray(prettierrcText))
      }
    }
    if (shouldAddPrettierrc) {
      await fsp.writeFile(prettierrc, prettierrcText)
      console.info(kleur.green('success'), `Added ${prettierrc}`)
    }
  }

  if (filesToAdd.includes('vscode')) {
    await fsp.mkdir('.vscode', {recursive: true})

    {
      const settings = {
        'prettier.prettierPath': relativeCwd(resolveRoot('node_modules')),
        'eslint.nodePath': relativeCwd(resolveRoot('node_modules')),
      }
      const file = `.vscode/settings.json`
      const text = (await hasFile(file))
        ? merge(String(await fsp.readFile(file)), settings)
        : JSON.stringify(settings, null, '  ')
      await fsp.writeFile(file, text)
      console.info(kleur.green('success'), `Added ${file}`)
    }

    {
      const extensions = {
        recommendations: ['dbaeumer.vscode-eslint', 'esbenp.prettier-vscode'],
      }
      const file = `.vscode/extensions.json`
      const text = (await hasFile(file))
        ? merge(String(await fsp.readFile(file)), extensions, (dest, src) =>
            Array.isArray(dest) ? [...new Set(dest.concat(src))] : src
          )
        : JSON.stringify(extensions, null, '  ')
      await fsp.writeFile(file, text)
      console.info(kleur.green('success'), `Added ${file}`)
    }
  }
}
