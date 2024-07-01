'use strict'
const path = require('node:path')

const log = require('@vc-cli/log')
const Package = require('@vc-cli/package')

const { COMMAND_TO_PROJECT_NAME, CACHE_DIR } = require('./config')
async function exec() {
  let targetPath = process.env.CLI_TARGET_PATH
  const homePath = process.env.CLI_HOME_PATH
  const pkgName = COMMAND_TO_PROJECT_NAME[arguments[arguments.length - 1].name()]
  const pkgVersion = 'latest'
  let pkg

  // 没有指定安装路径
  if (!targetPath) {
    // 默认安装到：用户主目录/.vc-cli/dependencies
    targetPath = path.resolve(homePath, CACHE_DIR)
    // 默认安装到：用户主目录/.vc-cli/dependencies/node_modules
    const storeDir = path.resolve(targetPath, 'node_modules')

    log.verbose('没有指定安装路径-targetPath::', targetPath)
    log.verbose('没有指定安装路径-storeDir::', storeDir)
    log.verbose('没有指定安装路径-pkgName:', pkgName)
    log.verbose('没有指定安装路径-pkgVersion:', pkgVersion)

    pkg = new Package({
      targetPath,
      storeDir,
      pkgName,
      pkgVersion
    })
    if (pkg.exists()) {
      // 更新
    } else {
      console.log('======install======')
      // 安装
      await pkg.install()
    }
  } else {
    // 指定了安装路径
    log.verbose('指定安装路径-targetPath::', targetPath)
    log.verbose('指定安装路径-pkgName:', pkgName)
    log.verbose('指定安装路径-pkgVersion:', pkgVersion)

    pkg = new Package({
      targetPath,
      pkgName,
      pkgVersion
    })
    // 找到入口文件
    const rootFile = pkg.getRootFilePath()
    // 调用init命令下的方法，将参数传入
    require(rootFile).apply(null, arguments)
  }
}

module.exports = exec
