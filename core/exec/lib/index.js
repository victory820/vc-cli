'use strict'
const path = require('node:path')
const cp = require('node:child_process')

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
    try {
      if (await pkg.exists()) {
        // 更新
        await pkg.update()
      } else {
        // 安装
        await pkg.install()
      }
    } catch (error) {
      throw new Error('package install fail')
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
  }

  // 找到入口文件
  const rootFile = pkg.getRootFilePath()
  if (rootFile) {
    try {
      // console.log('00==', this.opts())
      // TODO 这里向下传入的参数，可以优化。目前是数组：第一个是名称，第二个是选项
      // 调用init命令下的方法，将参数传入
      // const args = Array.from(arguments)
      // const cmd = args[args.length - 1]
      // const o = new Object(null)
      // Object.keys(cmd).forEach((key) => {
      //   if (cmd.hasOwnProperty(key) && !key.startsWith('_') && key !== 'parent') {
      //     o[key] = cmd[key]
      //   }
      // })
      // console.log('-99-', this)
      const newArgs = JSON.stringify([pkgName, this.opts()])
      // console.log(newArgs)
      const code = `require('${rootFile}').call(null, ${newArgs})`
      // const code = ''
      // windows内核
      // cp.spawn('cmd', ['/c', 'node', '-e', code])
      // linux内核
      const child = spawnCompatibility('node', ['-e', code], {
        cwd: process.cwd(), // 当前工作目录（current working directory）
        stdio: 'inherit' // 子进程执行的结果都在父进程中打印。可以在父进程看到整个过程
      })
      // 错误回调
      child.on('error', (e) => {
        log.error(e.message)
        process.exit(1)
      })
      // 结束回调
      child.on('exit', (e) => {
        log.verbose('spawn:::', +e)
        process.exit(e)
      })
    } catch (error) {
      log.error(error.message)
    }
  }
}

function spawnCompatibility(command, args, options) {
  const win32 = process.platform === 'win32'
  const cmd = win32 ? 'cmd' : command
  const cmdArgs = win32 ? ['/c'].concat(command, args) : args
  return cp.spawn(cmd, cmdArgs, options || {})
}

module.exports = exec
