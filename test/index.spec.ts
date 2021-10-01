import {run} from '../src/index'

const cwd = process.cwd()
beforeEach(() => {
  process.chdir(cwd)
})

test('run', async () => {
  await run([])
})

test('run ignored', async () => {
  await run([require.resolve('es-jest')])
})

test('run js-only', async () => {
  process.chdir('./test/fixtures/js-only')
  await run([])
})

test('show help', async () => {
  const mockLog = jest.fn()
  jest.spyOn(console, 'log').mockImplementation(mockLog)
  await run(['-h'])
  await run(['--help'])
  expect(mockLog).toBeCalledTimes(2)
  jest.restoreAllMocks()
})
