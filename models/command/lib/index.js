'use strict'

const semver = require('semver')
const colors = require('colors')

const log = require('@vc-cli/log')

const { LOW_NODE_VERSION } = require('./const')

class Command {
  constructor(argv) {
    // [pkgName, options对象]
    log.verbose('Command基类接受参数：', argv)
    if (!argv) {
      throw new Error('参数不能为空')
    }
    if (!Array.isArray(argv)) {
      throw new Error('参数必须为数组')
    }
    if (!argv.length) {
      throw new Error('参数不能为空')
    }

    // 挂载参数，子类使用
    // this._argv = argv
    this._pkgName = argv[0] || ''
    this._options = argv[1] || {}

    let runner = new Promise((resolve, reject) => {
      let chain = Promise.resolve()
      chain = chain.then(() => {
        this.checkNodeVersion()
      })
      // chain = chain.then(() => {
      //   this.checkArgs()
      // })
      chain = chain.then(() => {
        this.init()
      })
      chain = chain.then(() => {
        this.exec()
      })
      chain.catch((err) => {
        log.error(err.message)
      })
    })
  }

  checkArgs() {
    // this._cmd = this._argv[this._argv.length - 1]
    // this._argv = this._argv.slice(0, this._argv.length - 1)
    // console.log('====', this._cmd)
    // console.log('----------------------------------------')
    // console.log('==', this._argv)
  }

  checkNodeVersion() {
    // 处理低版本node不支持

    // 当前node版本
    const currentNodeVersion = process.version
    const minVersion = LOW_NODE_VERSION

    // 对比版本号
    if (semver.lt(currentNodeVersion, minVersion)) {
      throw new Error(colors.red(`脚手架需要 v${minVersion} 以上版本的node`))
    }
  }

  init() {
    throw new Error('command类中init方法必须实现')
  }

  exec() {
    throw new Error('command类中exec方法必须实现')
  }
}

module.exports = Command
