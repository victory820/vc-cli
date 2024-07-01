'use strict'

const { isObject } = require('@vc-cli/utils')
class Package {
  constructor(options) {
    if (!options) {
      throw new Error('options is required')
    }
    if (!isObject(options)) {
      throw new Error('options must be Object')
    }
    console.log('Package...', options)
    // package的路径
    this.targetPath = options.targetPath
    // 远程下载后存储路径
    this.storePath = options.storePath
    // 包名
    this.pkgName = options.pkgName
    // 包版本
    this.pkgVersion = options.pkgVersion
  }

  // 判断当前package是否存在
  exists() {}

  install() {}

  update() {}

  // 获取入口文件的路径
  getRootFilePath() {}
}

module.exports = Package
