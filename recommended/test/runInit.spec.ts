import fs from 'fs'
import path from 'path'
import {execSync} from 'child_process'
import {runInit} from '../src/runInit'

const resolveRelative = path.resolve.bind(null, __dirname)
const cwd = process.cwd()
const mockLog = jest.fn()
jest.spyOn(console, 'info').mockImplementation(mockLog)

beforeAll(() => {
  process.chdir(resolveRelative('fixtures/run-init'))
})

afterAll(() => {
  process.chdir(cwd)
})

beforeEach(() => {
  mockLog.mockClear()
  execSync(`rm -f .*.js .vscode/*.json`)
})

test('throw', async () => {
  await expect(runInit()).rejects.toThrow()
})

test('add none', async () => {
  await runInit({
    answers: {
      filesToAdd: [],
      rmEslintrc: false,
      rmPrettierrc: false,
    },
  })
  expect(
    mockLog.mock.calls.map((x: string[]) => x.join(' ')).join('\n')
  ).toMatchInlineSnapshot(`""`)
})

test('add all', async () => {
  await runInit({
    answers: {
      filesToAdd: ['rc', 'vscode'],
      rmEslintrc: false,
      rmPrettierrc: false,
    },
  })
  expect(mockLog.mock.calls.map((x: string[]) => x.join(' ')).join('\n'))
    .toMatchInlineSnapshot(`
    "success Added .eslintrc.js
    success Added .prettierrc.js
    success Added .vscode/settings.json
    success Added .vscode/extensions.json"
  `)
})

test('add rc only', async () => {
  await runInit({
    answers: {
      filesToAdd: ['rc'],
      rmEslintrc: false,
      rmPrettierrc: false,
    },
  })
  expect(mockLog.mock.calls.map((x: string[]) => x.join(' ')).join('\n'))
    .toMatchInlineSnapshot(`
    "success Added .eslintrc.js
    success Added .prettierrc.js"
  `)
})

test('add rc only -- no', async () => {
  execSync('touch .eslintrc.js')
  execSync('touch .prettierrc.js')
  await runInit({
    answers: {
      filesToAdd: ['rc'],
      rmEslintrc: false,
      rmPrettierrc: false,
    },
  })
  const calls = mockLog.mock.calls.flat().join(' ')
  expect(calls).toMatch(/Skip adding .eslintrc.js/)
  expect(calls).toMatch(/Skip adding .prettierrc.js/)
})

test('add rc only -- yes', async () => {
  execSync('touch .eslintrc.js')
  execSync('touch .prettierrc.js')
  await runInit({
    answers: {
      filesToAdd: ['rc'],
      rmEslintrc: true,
      rmPrettierrc: true,
    },
  })
  expect(mockLog.mock.calls.map((x: string[]) => x.join(' ')).join('\n'))
    .toMatchInlineSnapshot(`
    "success Added .eslintrc.js
    success Added .prettierrc.js"
  `)
})

test('add vscode only', async () => {
  await runInit({
    answers: {
      filesToAdd: ['vscode'],
      rmEslintrc: false,
      rmPrettierrc: false,
    },
  })
  expect(mockLog.mock.calls.map((x: string[]) => x.join(' ')).join('\n'))
    .toMatchInlineSnapshot(`
    "success Added .vscode/settings.json
    success Added .vscode/extensions.json"
  `)
})

test('add vscode - merge', async () => {
  const settingsFile = '.vscode/settings.json'
  const extensionsFile = '.vscode/extensions.json'
  fs.mkdirSync('.vscode', {recursive: true})
  fs.writeFileSync(
    settingsFile,
    JSON.stringify({
      'editor.formatOnSave': true,
    })
  )
  fs.writeFileSync(
    extensionsFile,
    JSON.stringify({
      unwantedRecommendations: [],
      recommendations: ['dbaeumer.vscode-eslint', 'wmaurer.change-case'],
    })
  )
  await runInit({
    answers: {
      filesToAdd: ['vscode'],
      rmEslintrc: false,
      rmPrettierrc: false,
    },
  })
  expect(mockLog.mock.calls.map((x: string[]) => x.join(' ')).join('\n'))
    .toMatchInlineSnapshot(`
    "success Added .vscode/settings.json
    success Added .vscode/extensions.json"
  `)
  expect(JSON.parse(String(fs.readFileSync(settingsFile)))).toMatchObject({
    'editor.formatOnSave': true,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    'prettier.prettierPath': expect.any(String),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    'eslint.nodePath': expect.any(String),
  })
  expect(JSON.parse(String(fs.readFileSync(extensionsFile))))
    .toMatchInlineSnapshot(`
    Object {
      "recommendations": Array [
        "dbaeumer.vscode-eslint",
        "wmaurer.change-case",
        "esbenp.prettier-vscode",
      ],
      "unwantedRecommendations": Array [],
    }
  `)
})
