import { isObject } from '@rhz-mini-vue/shared'
import { mutableHandlers } from './baseHandlers'

export const enum ReactiveFlags {
  SKIP = '__v_skip',
  IS_REACTIVE = '__v_isReactive',
  IS_READONLY = '__v_isReadonly',
  IS_SHALLOW = '__v_isShallow',
  RAW = '__v_raw'
}

export interface Target {
  [ReactiveFlags.SKIP]?: boolean
  [ReactiveFlags.IS_REACTIVE]?: boolean
  [ReactiveFlags.IS_READONLY]?: boolean
  [ReactiveFlags.IS_SHALLOW]?: boolean
  [ReactiveFlags.RAW]?: any
}

// 使用WeakMap key必须是对象 而且是弱引用 方便垃圾回收
export const reactiveMap = new WeakMap<Target, any>()
export const readonlyMap = new WeakMap<Target, any>()
export const shallowReadonlyMap = new WeakMap<Target, any>()

export function reactive(target) {
  return createReactiveObject(target, reactiveMap, mutableHandlers)
}

function createReactiveObject(target, proxyMap, baseHandlers) {
  // 如果命中的话就直接返回 没必要创建两个一样proxy
  const existingProxy = proxyMap.get(target)
  if (existingProxy) {
    return existingProxy
  }

  const proxy = new Proxy(target, baseHandlers)

  // 把创建好的 proxy 给存起来
  proxyMap.set(target, proxy)
  // 返回代理对象
  return proxy
}

export function isReactive(value) {
  // 如果 value 是 proxy 的属性
  // 取值操作 会触发 get 操作，而在 createGetter 里面会判断
  // 如果 value 是普通对象的话 会返回 undefined
  return !!value[ReactiveFlags.IS_REACTIVE]
}

export const toReactive = <T extends unknown>(value: T): T =>
  isObject(value) ? reactive(value) : value
