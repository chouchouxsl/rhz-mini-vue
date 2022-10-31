import { ReactiveFlags, Target } from './reactive'

const get = createGetter()
const set = createSetter()

function createGetter(isReadonly = false, shallow = false) {
  return function get(target: Target, key: string | symbol, receiver: object) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      // 在这里劫持到 获取这个属性 判断key 是不是 __is_reactive
      // 如果是 那么就返回true
      return true
    }

    const res = Reflect.get(target, key, receiver)
    return res
  }
}

function createSetter(shallow = false) {
  return function set(
    target: Target,
    key: string | symbol,
    value: unknown,
    receiver: object
  ) {
    const result: boolean = Reflect.set(target, key, value, receiver)
    return result
  }
}

export const mutableHandlers: ProxyHandler<object> = {
  get,
  set
}
