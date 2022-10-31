const execa = require('execa')
const args = require('minimist')(process.argv.slice(2)) // 解析命令行参数 前两项是node路径和当前的绝对路径 不需要截取掉

/* 
  _: 目标文件数组
  f: 打包的格式
  s: 是否开起sourcemap
*/
const { _, f = 'global', s = false } = args
// 当前打包的文件目标
const target = _.length ? _[0] : 'reactivity'

execa('rollup', ['-wc', '--environment', [`TARGET:${target}`, `FORMATS:${f}`, `SOURCE_MAP:${s}`]], {
  stdio: 'inherit' // 这个子进程的输出是在我们当前命令行中输出的
})
