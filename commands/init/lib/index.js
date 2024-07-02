'use strict'

const fs = require('node:fs')

const { confirm } = require('@inquirer/prompts')
const fse = require('fs-extra')

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
  async exec() {
    try {
      // 准备阶段
      await this.prepare()
      // 下载模版
      // 模板安装
    } catch (error) {
      log.error(error.message)
    }
  }

  async prepare() {
    // 当前目录是否为空
    const cwdPath = process.cwd()
    if (!this.isDirEmpty(cwdPath)) {
      // 如果目录下有内容
      let isContinue = true
      if (!this.force) {
        // 非强制处理，才询问
        isContinue = await confirm({ message: '当前目录不为空是否继续创建项目？', default: false })
      }
      if (isContinue) {
        const isDelete = await confirm({
          message: '是否删除当前文件夹下所有文件？',
          default: false
        })
        if (isDelete) {
          console.log('删除所有')
          fse.emptyDirSync(cwdPath)
        }
      }
    }
  }
  isDirEmpty(cwdPath) {
    let fileList = fs.readdirSync(cwdPath)
    // 文件过滤
    fileList = fileList.filter((file) => {
      return !file.startsWith('.') && ['node_modules'].indexOf(file) < 0
    })
    return !fileList || fileList.length === 0
  }
}

function init(args) {
  // 可接受自定义init命令
  return new InitCommand(args)
}

module.exports = init
module.exports.InitCommand = InitCommand
