import {run} from '../src/index'

test('run', async () => {
  await run([])
})

test('show help', async () => {
  const mockLog = jest.fn()
  jest.spyOn(console, 'log').mockImplementation(mockLog)
  await run(['-h'])
  expect(mockLog).toBeCalled()
})
