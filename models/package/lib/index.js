'use strict'
const path = require('node:path')

const pkgDir = require('pkg-dir').sync
const npminstall = require('npminstall')
const pathExists = require('path-exists').sync
const fse = require('fs-extra')

const { isObject } = require('@vc-cli/utils')
const formatPath = require('@vc-cli/format-path')
const { getDefaultRegistry, getNpmInfo } = require('@vc-cli/get-npm-info')

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
    // 缓存目录前缀（在exec的配置文件中设定的包名）
    // '@vc-cli/init' => @vc-cli+init
    this.cacheFilePathPrefix = this.pkgName.replace('/', '+')
  }

  async getLatestVersion() {
    const result = await getNpmInfo(this.pkgName)
    return result['dist-tags'].latest
  }

  async prepare() {
    if (this.storeDir && !pathExists(this.storeDir)) {
      // 确保目录都存在，不存在直接创建
      fse.mkdirpSync(this.storeDir)
    }
    if (this.pkgVersion === 'latest') {
      this.pkgVersion = await this.getLatestVersion()
    }
  }

  get cacheFilePath() {
    // /Users/xxx/.vc-cli/dependencies/node_modules/.store/@vc-cli+init@0.0.8
    return path.resolve(this.storeDir, '.store', `${this.cacheFilePathPrefix}@${this.pkgVersion}`)
  }
  getSpecificCacheFilePath(version) {
    return path.resolve(this.storeDir, '.store', `${this.cacheFilePathPrefix}@${version}`)
  }

  // 判断当前package是否存在
  async exists() {
    if (this.storeDir) {
      // 已经指定路径安装（缓存模式）
      await this.prepare()
      // return pathExists(this.cacheFilePath)
      // TODO 这里判断路径下是否缓存包有待商榷。始终拿最新版本的话，不会走更新逻辑，每次都是安装最新
      return this.cacheFilePath.includes(this.cacheFilePathPrefix)
    } else {
      // 默认安装到用户主目录.vc-cli/dependencies/node_modules下，查看这个目录是否存在指定包
      return pathExists(this.targetPath)
    }
  }

  async install() {
    await this.prepare()
    return npminstall({
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
  }

  async update() {
    await this.prepare()
    // 获取最新的模块版本号
    const latestVersion = await this.getLatestVersion()
    const path = this.getSpecificCacheFilePath(latestVersion)
    // 查询最新版本号对应的路径是否存在
    if (!pathExists(path)) {
      // 不存在直接安装最新
      await npminstall({
        root: this.targetPath,
        storeDir: this.storeDir,
        registry: getDefaultRegistry(),
        pkgs: [
          {
            name: this.pkgName,
            version: latestVersion
          }
        ]
      })
      this.pkgVersion = latestVersion
    }
  }

  // 获取入口文件的路径
  getRootFilePath() {
    function _getRootFile(tempPath) {
      // 读取package.json所在目录
      const packageDir = pkgDir(tempPath)
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
    if (this.storeDir) {
      // /Users/用户名/.vc-cli/dependencies/node_modules/.store/@vc-cli+init@0.0.2/node_modules/@vc-cli/init/lib
      const tempTargetPath = path.resolve(this.cacheFilePath, 'node_modules', this.pkgName)
      return _getRootFile(tempTargetPath)
    } else {
      return _getRootFile(this.targetPath)
    }
  }
}

module.exports = Package
