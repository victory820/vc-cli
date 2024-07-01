'use strict'

const log = require('@vc-cli/log')
const Package = require('@vc-cli/package')

const { COMMAND_TO_PROJECT_NAME } = require('./config')
function exec() {
  const targetPath = process.env.CLI_TARGET_PATH
  const homePath = process.env.CLI_HOME_PATH
  log.verbose('exec-targetPath:', targetPath)
  log.verbose('exec-homePath:', homePath)

  const pkgName = COMMAND_TO_PROJECT_NAME[arguments[arguments.length - 1].name()]
  log.verbose('exec-pkgName:', pkgName)

  const options = {
    targetPath,
    homePath,
    pkgName,
    pkgVersion: 'latest' // 默认最新
  }

  new Package(options)
}

module.exports = exec
