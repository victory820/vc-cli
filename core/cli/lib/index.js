'use strict'
const os = require('node:os')
const path = require('node:path')

const semver = require('semver')
const rootCheck = require('root-check')
const pathExists = require('path-exists')
const colors = require('colors')
const { Command } = require('commander')
const log = require('@vc-cli/log')
const { getNpmInfo } = require('@vc-cli/get-npm-info')
// const init = require('@vc-cli/init')
const exec = require('@vc-cli/exec')

const pkg = require('../package.json')
const { CLI_USER_HOME, CLI_NAME } = require('./const')

// 生成命令实例
const program = new Command()

// 命令行中传入的参数
let userHome

async function index() {
  try {
    await prepare()
    registerCommand()
  } catch (error) {
    if (program.debug) {
      log.error('global:', error)
    } else {
      log.error('global:', error.message)
    }
  }
}

function registerCommand() {
  const { bin, version } = pkg
  if (bin) {
    const cliName = Object.keys(bin)[0] || CLI_NAME

    program
      .name(cliName)
      .usage('<command> [options]') // 只是展示文字
      .version(version)
      .option('-d, --debug', '是否开启调试模式', false)
      .option('-tp, --targetPath <targetPath>', '全局缓存路径', '')

    // 注册init命令
    program.command('init [projectName]').option('-f, --force', '是否强制初始化项目').action(exec)

    // 选项是否有debug值
    program.on('option:debug', function () {
      const { debug } = this.opts()
      process.env.CLI_LOG_LEVEL = debug ? 'verbose' : 'info'
      log.level = process.env.CLI_LOG_LEVEL
    })

    // 设置全局缓存路径
    program.on('option:targetPath', function () {
      const { targetPath } = this.opts()
      process.env.CLI_TARGET_PATH = targetPath
    })

    // 处理未知命令
    program.on('command:*', function (arr) {
      console.log(colors.red('未知的命令：' + obj[0]))
      // 获取所有已注册命令，使用name方法
      const availableCommands = program.commands.map((cmd) => cmd.name())

      if (availableCommands.length > 0) {
        console.log(colors.red('可用命令：', availableCommands.join(',')))
      }
    })

    // if (program.args && program.args.length < 1) {
    // 是否展示帮助信息
    // program.outputHelp()
    // }

    program.parse() // 不传参，可以兼容electron
  }
}

async function prepare() {
  checkPkgVersion()
  checkRoot()
  await checkUserHome()
  await checkEnv()
  await checkGlobalUpdate()
}

async function checkGlobalUpdate() {
  // 获取当前版本号和模块名
  const pkgName = pkg.name
  const pkgVersion = pkg.version
  try {
    // 调用npm接口，获取线上所有版本
    const data = await getNpmInfo(pkgName)
    if (data['dist-tags']) {
      const latest = data['dist-tags'].latest
      if (latest && semver.gt(latest, pkgVersion)) {
        log.warn(
          'vc-cli/core',
          colors.yellow(`请手动更新 ${pkgName}, 当前版本: ${pkgVersion}, 最新版本: ${latest}
更新命令: npm install ${pkgName} --location=global`)
        )
      }
    } else {
      log.error('getNpmInfo-version:', '最新版本获取失败')
    }
  } catch (error) {
    log.error('getNpmInfo:', error.message)
  }
}

async function checkEnv() {
  // 检查环境变量
  const pathEnv = path.resolve(userHome, '.env')
  if (await pathExists(pathEnv)) {
    const dotenv = require('dotenv')
    const envConfig = dotenv.config({
      path: pathEnv
    })
    createDefaultConfig()
    log.verbose('env:', process.env.CLI_HOME_PATH)
  } else {
    log.error('env:', '环境变量文件不存在，请在根目录下创建.env文件')
  }
}
function createDefaultConfig() {
  const config = {
    home: userHome
  }
  if (process.env.CLI_HOME_PATH) {
    config.cliHome = path.join(userHome, process.env.CLI_HOME_PATH)
  } else {
    config.cliHome = path.join(userHome, CLI_USER_HOME)
  }
  process.env.CLI_HOME_PATH = config.cliHome
}

async function checkUserHome() {
  // 用户主目录
  userHome = os.homedir()
  if (!userHome || !(await pathExists(userHome))) {
    log.error('userHome:', '当前用户主目录不存在')
  }
}

function checkRoot() {
  // 降低用户权限，即使使用sudo启动项目，也降级为用户权限
  // process.getuid(); 0为root用户，501为分组用户
  rootCheck()
}

function checkPkgVersion() {
  log.notice(`当前${pkg.name}版本：`, pkg.version)
}

module.exports = index
