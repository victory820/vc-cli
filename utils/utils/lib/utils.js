'use strict'

// 是否为对象
function isObject(val) {
  return Object.prototype.toString.call(val) === '[object Object]'
}

// 控制台loading效果
function spinner(loadText, str = '|/-\\') {
  const Spinner = require('cli-spinner').Spinner

  const sp = new Spinner(loadText + '%s')
  sp.setSpinnerString(str)
  sp.start()
  return sp
}

// 延迟操作
function sleep(time = 1000) {
  return new Promise((resolve) => {
    setTimeout(resolve, time)
  })
}

// 多线程，兼容方法（异步）
function spawnCompatibility(command, args, options) {
  const win32 = process.platform === 'win32'
  const cmd = win32 ? 'cmd' : command
  const cmdArgs = win32 ? ['/c'].concat(command, args) : args
  return require('node:child_process').spawn(cmd, cmdArgs, options || {})
}
// 多线程，兼容方法（同步）
function spawnCompatibilityAsync(command, args, options) {
  return new Promise((resolve, reject) => {
    const p = spawnCompatibility(command, args, options)
    p.on('error', (e) => {
      reject(e)
    })
    p.on('exit', (c) => {
      resolve(c)
    })
  })
}

module.exports = { isObject, spinner, sleep, spawnCompatibility, spawnCompatibilityAsync }
