import path from 'path'
import {run} from '../src/index'

// CI may be slow
jest.setTimeout(10 * 1000)

const cwd = process.cwd()
const resolveRelative = path.resolve.bind(null, __dirname)
const chdir = (dir: string) => process.chdir(resolveRelative(dir))
const mockLog = jest.spyOn(console, 'log').mockImplementation(jest.fn())
const mockExit = jest.spyOn(process, 'exit').mockImplementation((code) => {
  throw new Error(`Exit: ${String(code)}`)
})

afterAll(() => {
  process.chdir(cwd)
})

beforeEach(() => {
  mockExit.mockClear()
  mockLog.mockClear()
  process.chdir(cwd)
})

test('run ignored', async () => {
  await run([require.resolve('es-jest')])
})

test('run js-only', async () => {
  chdir('fixtures/js-only')
  expect(await run([])).resolves
})

test('run --no-cache', async () => {
  chdir('fixtures/js-only')
  expect(await run(['--no-cache'])).resolves
})

test('run --fix', async () => {
  chdir('fixtures/js-only')
  expect(await run(['--fix'])).resolves
})

test('run --init', async () => {
  chdir('fixtures/js-only')
  await expect(run(['--init'])).rejects.toThrow(/Required answers/)
  expect(mockExit).not.toBeCalled()
})

test('run exit-shell', async () => {
  chdir('fixtures/exit-shell')
  await expect(run([])).rejects.toThrow(/Exit/)
  expect(mockExit).toBeCalled()
})

test('run resolve-config-file', async () => {
  chdir('fixtures/resolve-config-file')
  expect(await run([])).resolves
})

test('run resolve-config-pkg', async () => {
  chdir('fixtures/resolve-config-pkg')
  expect(await run([])).resolves
})

test('show help', async () => {
  await run(['-h'])
  await run(['--help'])
  expect(mockLog).toBeCalledTimes(2)
  jest.restoreAllMocks()
})
