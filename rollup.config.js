import path from 'path'
import ts from 'rollup-plugin-typescript2'
import json from '@rollup/plugin-json'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'

if (!process.env.TARGET) {
  throw new Error('TARGET package must be specified via --environment flag.')
}

// 需要根据target 找到要打包的目录
const packagesDir = path.resolve(__dirname, 'packages') // 根目录
const packageDir = path.resolve(packagesDir, process.env.TARGET) // 要打包的入口
const resolve = p => path.resolve(packageDir, p)
const pkg = require(resolve('package.json')) // 目标文件pkg
const packageOptions = pkg.buildOptions || {} // 自定义参数
const name = packageOptions.filename || path.basename(packageDir) // 目标文件名

const outputConfigs = {
  'esm-bundler': {
    file: resolve(`dist/${name}.esm-bundler.js`),
    format: 'es'
  },
  cjs: {
    file: resolve(`dist/${name}.cjs.js`),
    format: 'cjs'
  },
  global: {
    file: resolve(`dist/${name}.global.js`),
    format: 'iife'
  }
}

// 默认参数
const defaultFormats = ['esm-bundler', 'cjs']
// 从命令行传来的 参数
const inlineFormats = process.env.FORMATS && process.env.FORMATS.split(',')
// 最终的格式化结果
const packageFormats = inlineFormats || packageOptions.formats || defaultFormats

console.log('🤪 packageFormats >>:', packageFormats)

function createConfig(format, output, plugins = []) {
  if (!output) {
    console.log(require('chalk').yellow(`invalid format: "${format}"`))
    process.exit(1)
  }

  const external = [] //排除文件
  const isGlobalBuild = /global/.test(format)
  output.sourcemap = !!process.env.SOURCE_MAP

  if (isGlobalBuild) {
    output.name = packageOptions.name
  } else {
    external = [
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.peerDependencies || {}),
      ...['path', 'url', 'stream'] // for @vue/compiler-sfc / server-renderer
    ]
  }

  return {
    // createConfig的结果就是rollup的配置
    input: resolve(`src/index.ts`),
    output,
    external,
    plugins: [
      json(),
      ts(), // 将ts转化成js文件
      commonjs(),
      nodeResolve()
    ]
  }
}

const packageConfigs = packageFormats.map(format => createConfig(format, outputConfigs[format]))

export default packageConfigs
