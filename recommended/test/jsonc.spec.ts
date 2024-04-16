/* eslint-disable @typescript-eslint/no-unsafe-return */
import {merge} from '../src/jsonc'

test('merge empty', () => {
  expect(() => merge('', {})).toThrow(/ParseError/)
  expect(() => merge('{n: 1}', {})).not.toThrow(/ParseError/)
})

test('merge object', () => {
  const cases = [
    [{}, {foo: 1, bar: 1}],
    [{foo: 1}, {foo: 2}],
    [{foo: 1, bar: 2}, {foo: 2}],
    [{foo: [1]}, {foo: 'v'}],
  ]
  expect(cases.map(([d, s]) => JSON.parse(merge(JSON.stringify(d), s))))
    .toMatchInlineSnapshot(`
    Array [
      Object {
        "bar": 1,
        "foo": 1,
      },
      Object {
        "foo": 2,
      },
      Object {
        "bar": 2,
        "foo": 2,
      },
      Object {
        "foo": "v",
      },
    ]
  `)
})

test('merge with concat', () => {
  const cases = [
    [{foo: 1}, {foo: 2}],
    [{foo: [1]}, {foo: [2]}],
  ]
  expect(
    cases.map(([d, s]) =>
      JSON.parse(
        merge(JSON.stringify(d), s, (dest, src) => {
          return Array.isArray(dest) ? dest.concat(src) : src
        }),
      ),
    ),
  ).toMatchInlineSnapshot(`
    Array [
      Object {
        "foo": 2,
      },
      Object {
        "foo": Array [
          1,
          2,
        ],
      },
    ]
  `)
})

test('preserve comment', () => {
  const text = `{
  // comment
  "foo": 1,
  }`
  expect(merge(text, {foo: 2})).toMatchInlineSnapshot(`
    "{
      // comment
      \\"foo\\": 2,
      }"
  `)
})
