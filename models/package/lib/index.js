'use strict'
const path = require('node:path')

const pkgDir = require('pkg-dir')
const npminstall = require('npminstall')

const { isObject } = require('@vc-cli/utils')
const formatPath = require('@vc-cli/format-path')
const { getDefaultRegistry } = require('@vc-cli/get-npm-info')

class Package {
  constructor(options) {
    if (!options) {
      throw new Error('options is required')
    }
    if (!isObject(options)) {
      throw new Error('options must be Object')
    }
    // package的路径
    this.targetPath = options.targetPath
    // 远程下载后存储路径（类似node_modules这层）
    this.storeDir = options.storeDir
    // 包名
    this.pkgName = options.pkgName
    // 包版本
    this.pkgVersion = options.pkgVersion
  }

  // 判断当前package是否存在
  exists() {}

  async install() {
    try {
      await npminstall({
        root: this.targetPath,
        storeDir: this.storeDir,
        registry: getDefaultRegistry(),
        pkgs: [
          {
            name: this.pkgName,
            version: this.pkgVersion
          }
        ]
      })
    } catch (error) {
      throw new Error('package install error')
    }
  }

  update() {}

  // 获取入口文件的路径
  getRootFilePath() {
    // 读取package.json所在目录
    const packageDir = pkgDir.sync(this.targetPath)
    if (packageDir) {
      const pkgFile = path.resolve(packageDir, 'package.json')
      // 读取package.json
      if (pkgFile) {
        const pkgInfo = require(pkgFile)
        // 寻找main/bin
        if (pkgInfo && pkgInfo.main) {
          // 路径的兼容
          const resultPath = path.resolve(packageDir, pkgInfo.main)
          return formatPath(resultPath)
        }
      }
    }
    return null
  }
}

module.exports = Package
