import { extend } from '@rhz-mini-vue/shared'
import { Dep, createDep } from './dep'
import { TrackOpTypes, TriggerOpTypes } from './operations'

let activeEffect: ReactiveEffect | undefined = void 0
let shouldTrack = false
const targetMap = new WeakMap()

export type EffectScheduler = (...args: any[]) => any

export class ReactiveEffect<T = any> {
  active = true
  deps: Dep[] = []
  parent: ReactiveEffect | undefined = void 0
  onStop?: () => void
  constructor(public fn: () => T, public scheduler?: EffectScheduler) {}

  run() {
    console.log(' 🤪 run !!')
    // 当前判断是否要收集依赖
    // 不收集就直接返回函数并执行
    if (!this.active) {
      return this.fn()
    }

    // 下面是收集依赖的逻辑
    let lastShouldTrack = shouldTrack
    try {
      this.parent = activeEffect
      activeEffect = this
      shouldTrack = true
      return this.fn()
    } finally {
      activeEffect = this.parent
      shouldTrack = lastShouldTrack
      this.parent = void 0
    }
  }

  stop() {
    // 如果第一次执行 stop 后 active 就 false 了
    if (this.active) {
      // 这是为了防止重复的调用，执行 stop 逻辑
      cleanupEffect(this)
      if (this.onStop) {
        this.onStop()
      }
      this.active = false
    }
  }
}

export interface ReactiveEffectRunner<T = any> {
  (): T
  effect: ReactiveEffect
}

export function effect<T = any>(
  fn: () => T,
  options = {}
): ReactiveEffectRunner {
  const _effect = new ReactiveEffect(fn)

  // 将用户传过来的值合并到_effect上
  extend(_effect, options)
  //  首先要执行一次
  _effect.run()

  //  将effect的run返回 用户可以自行选择调用
  const runner = _effect.run.bind(_effect) as ReactiveEffectRunner
  runner.effect = _effect
  return runner
}

export function isTracking() {
  return shouldTrack && activeEffect !== undefined
}

export function track(target: object, type: TrackOpTypes, key: unknown) {
  if (!isTracking()) {
    return
  }

  console.log(`触发 track -> target: ${target} type:${type} key:${key}`)

  // 首先我们需要最终存储的数据结构为 {}为Map []为Set
  // targetMap:{depsMap:{dep[]}}

  // 先根据target 获取deps
  let depsMap = targetMap.get(target)
  // 判断是否存在 第一次需要初始化
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()))
  }
  // 判断deps中是否存在key
  // 不存在需要新建Set集合
  let dep = depsMap.get(key)
  if (!dep) {
    depsMap.set(key, (dep = createDep()))
  }
  // 执行
  trackEffects(dep)
}

export function trackEffects(dep: Dep) {
  // 看一下这个属性有没有存过这个effect
  let shouldTrack = !dep.has(activeEffect as ReactiveEffect)
  if (shouldTrack) {
    dep.add(activeEffect as ReactiveEffect) // {对象：map{name:set[effect,effect]}}
    ;(activeEffect as ReactiveEffect).deps.push(dep) // { 对象：{name:set,age:set}
  }
}

export function trigger(target: object, type: TriggerOpTypes, key: unknown) {
  let depsMap = targetMap.get(target)
  // 属性修改的属性 根本没有依赖任何的effect直接return
  if (!depsMap) return
  console.log('🤪 depsMap >>:', depsMap)
  // 分别将他们取出整理
  // 取出所有的Dep 放到 deps中
  let deps: Dep[] = []
  if (key !== void 0) {
    deps.push(depsMap.get(key))
  }
  console.log('🤪 deps >>:', deps)

  // 取出Dep中所有的effect 放到 effects中
  const effects: ReactiveEffect[] = []
  for (const dep of deps) {
    if (dep) {
      effects.push(...dep)
    }
  }
  console.log('🤪 effects >>:', effects)

  // 依次执行effect
  triggerEffects(createDep(effects))
}

export function triggerEffects(dep: Dep) {
  for (const effect of dep) {
    // 如果当前effect执行 和 要执行的effect是同一个，不要执行了 防止循环
    if (effect !== activeEffect) {
      if (effect.scheduler) {
          return effect.scheduler()
      }
      effect.run() // 执行effect
    }
  }
}

export function cleanupEffect(effect: ReactiveEffect) {
  // 找到所有依赖这个 effect 的响应式对象
  // 从这些响应式对象里面把 effect 给删除掉
  const { deps } = effect
  if (deps.length) {
    // 清除 deps 中 每个dep中的 effect
    for (let i = 0; i < deps.length; i++) {
      deps[i].delete(effect)
    }
    // 清空deps
    deps.length = 0
  }
}

export function stop(runner: ReactiveEffectRunner) {
  runner.effect.stop()
}
