'use client'

import { parseAsJson, useQueryState } from '../../../../dist'
import { parseAsArrayOf } from '../../../lib'

const escaped = '-_.!~*\'()?#/&,"`<>{}[]@$£%+=:;'

export default function CompoundParsersDemo() {
  const [code, setCode] = useQueryState(
    'code',
    parseAsJson<any>().withDefault({})
  )
  const [array, setArray] = useQueryState(
    'array',
    parseAsArrayOf(parseAsJson<any>()).withDefault([])
  )
  return (
    <>
      <h1>Compound parsers</h1>
      <section>
        <h2>JSON</h2>
        <button onClick={() => setCode({})}>Set to {'{}'}</button>
        <button onClick={() => setCode([])}>Set to {'[]'}</button>
        <button onClick={() => setCode([1, 2, 3])}>Set to {'[1,2,3]'}</button>
        <button onClick={() => setCode({ hello: 'world' })}>
          Set to {'{hello:"world"}'}
        </button>
        <button onClick={() => setCode({ escaped })}>
          Set to escaped chars
        </button>
        <pre>
          <code>{JSON.stringify(code, null, 2)}</code>
        </pre>
      </section>
      <section>
        <h2>Arrays</h2>
        <button onClick={() => setArray(null)}>Clear</button>
        <button onClick={() => setArray(a => [...a, {}])}>Push {'{}'}</button>
        <button onClick={() => setArray(a => [...a, [1, 2, 3]])}>
          Push {'[1,2,3]'}
        </button>
        <button onClick={() => setArray(a => [...a, { hello: 'world' }])}>
          Push hello world
        </button>
        <button onClick={() => setArray(a => [...a, { escaped }])}>
          Push escaped chars
        </button>
        <pre>
          <code>{JSON.stringify(array, null, 2)}</code>
        </pre>
      </section>
    </>
  )
}