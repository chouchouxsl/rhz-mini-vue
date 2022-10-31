import { expect, describe, test } from 'vitest'
import { reactive, isReactive } from '../src/reactive'

describe('reactivity/reactive', () => {
  test('Object', () => {
    const ob = { a: 1 }
    const pob = reactive(ob)

    expect(pob).not.toBe(ob)
    expect(isReactive(ob)).toBe(false)
    expect(isReactive(pob)).toBe(true)
    // get
    expect(pob.a).toBe(1)
    // has
    expect('a' in pob).toBe(true)
    // ownKeys
    expect(Object.keys(pob)).toEqual(['a'])
  })
})
