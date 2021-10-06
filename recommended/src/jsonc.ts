import JSONC from 'jsonc-parser'

const defaultReplacer = (dest: unknown, src: unknown) => {
  return src
}

const defaultFormattingOptions: JSONC.FormattingOptions = {
  tabSize: 2,
  insertSpaces: true,
}

const formatError = (e: JSONC.ParseError) =>
  `${JSONC.printParseErrorCode(e.error)} at offset: ${e.offset}, length: ${
    e.length
  }`

export const merge = (
  text: string,
  source: Record<string, unknown>,
  replacer = defaultReplacer,
  formattingOptions = defaultFormattingOptions
) => {
  const errors: JSONC.ParseError[] = []
  const json = JSONC.parse(text, errors) as typeof source
  // non-standard json returns empty object and errors
  if (!json && errors.length) {
    throw new Error('ParseError: \n' + errors.map(formatError).join('\n'))
  }

  return Object.entries(source).reduce((acc, [k, v]) => {
    return JSONC.applyEdits(
      acc,
      JSONC.modify(acc, [k], replacer(json[k], v), {formattingOptions})
    )
  }, text)
}
