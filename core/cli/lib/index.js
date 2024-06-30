'use strict'
const os = require('node:os')
const path = require('node:path')

const semver = require('semver')
const rootCheck = require('root-check')
const pathExists = require('path-exists')
const minimist = require('minimist')
const colors = require('colors')
const log = require('@vc-cli/log')
const { getNpmInfo } = require('@vc-cli/get-npm-info')

const pkg = require('../package.json')
const { LOW_NODE_VERSION, CLI_USER_HOME } = require('./const')

// 命令行中传入的参数
let args, userHome

async function index(args) {
  try {
    checkPkgVersion()
    checkNodeVersion()
    checkRoot()
    await checkUserHome()
    checkInputArgs()
    await checkEnv()
    await checkGlobalUpdate()
  } catch (error) {
    log.error('global:', error.message)
  }
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
    log.error('env:', '环境变量文件不存在')
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

function checkInputArgs() {
  // 检查入参，如果有debug，开启全局调试模式
  args = minimist(process.argv.slice(2))
  checkArgs()
}

function checkArgs() {
  const isDebug = args.debug
  if (isDebug) {
    process.env.LOG_LEVEL = 'verbose'
  } else {
    process.env.LOG_LEVEL = 'info'
  }
  log.level = process.env.LOG_LEVEL
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

function checkNodeVersion() {
  // 处理低版本node不支持

  // 当前node版本
  const currentVersion = process.version
  const minVersion = LOW_NODE_VERSION

  // 对比版本号
  if (semver.lt(currentVersion, minVersion)) {
    log.error('nodeVersion:', `脚手架需要 v${minVersion} 以上版本的node`)
  }
}

function checkPkgVersion() {
  log.notice(`当前${pkg.name}版本：`, pkg.version)
}

module.exports = index
