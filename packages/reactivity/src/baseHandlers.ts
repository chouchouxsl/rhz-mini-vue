import { isObject } from '@rhz-mini-vue/shared'
import { track, trigger } from './effect'
import { TrackOpTypes, TriggerOpTypes } from './operations'
import { reactive, ReactiveFlags, Target } from './reactive'

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

    // 不是只读就要进行收集依赖
    if (!isReadonly) {
      track(target, TrackOpTypes.GET, key)
    }

    // 把内部所有的是 object 的值都用 reactive 包裹，变成响应式对象
    // 如果说这个 res 值是一个对象的话，那么我们需要把获取到的 res 也转换成 reactive
    // res 等于 target[key]
    if (isObject(res)) {
      return reactive(res)
    }

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

    // 在触发 set 的时候进行触发依赖
    trigger(target, TriggerOpTypes.SET, key)

    return result
  }
}

export const mutableHandlers: ProxyHandler<object> = {
  get,
  set
}
