'use strict'

const Command = require('@vc-cli/command')
const log = require('@vc-cli/log')

class InitCommand extends Command {
  init() {
    // console.log('从父类获取参数', this._argv)
    this.projectName = this._pkgName || ''
    this.force = !!this._options.force
    log.verbose('projectName', this.projectName)
    log.verbose('force', this.force)
  }
  exec() {
    console.log('init业务逻辑')
  }
}

function init(args) {
  // 可接受自定义init命令
  return new InitCommand(args)
}

module.exports = init
module.exports.InitCommand = InitCommand
