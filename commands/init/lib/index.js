'use strict'

const fs = require('node:fs')

const { confirm, select, input } = require('@inquirer/prompts')
const fse = require('fs-extra')
const semver = require('semver')

const Command = require('@vc-cli/command')
const log = require('@vc-cli/log')

const { TYPE_PROJECT, TYPE_COMPONENT } = require('./const')

class InitCommand extends Command {
  init() {
    this.projectName = this._pkgName || ''
    this.force = !!this._options.force
    log.verbose('projectName', this.projectName)
    log.verbose('force', this.force)
  }
  async exec() {
    try {
      // 准备阶段
      const result = await this.prepare()
      if (result) {
        // 下载模版
        // 模板安装
      }
    } catch (error) {
      log.error(error.message)
    }
  }

  async prepare() {
    const cwdPath = process.cwd()
    // 当前目录是否为空
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
          console.log('删除所有', cwdPath)
          // fse.emptyDirSync(cwdPath)
        }
      } else {
        return false
      }
    }
    return this.getProjectInfo()
  }

  async getProjectInfo() {
    const projectInfo = {}
    // 选择创建项目或组件
    const typeInfo = await select({
      message: '请选择初始化类型',
      default: TYPE_PROJECT,
      choices: [
        {
          name: '项目',
          value: TYPE_PROJECT
        },
        {
          name: '组件',
          value: TYPE_COMPONENT
        }
      ]
    })
    if (typeInfo === TYPE_PROJECT) {
      const pkgName = await input({
        message: '请输入项目名称',
        default: '',
        validate: function (v) {
          // 首字符必须为英文字母；尾字符必须为英文或数字不能是符号；字符仅允许_-
          const reg = /^[a-zA-Z][\w-]{0,30}[a-zA-Z0-9]$/
          if (reg.test(v)) {
            return true
          } else {
            return '名称格式错误：仅以英文字母开头、英文或数字结尾、最多32个字符长度'
          }
        }
      })
      const pkgVersion = await input({
        message: '请输入项目版本号',
        default: '0.0.1',
        validate: function (v) {
          if (semver.valid(v)) {
            return true
          } else {
            return '版本格式错误'
          }
        }
      })
      console.log('pkgName', pkgName)
      console.log('pkgVersion', pkgVersion)
    } else if (typeInfo === TYPE_COMPONENT) {
    }
    // 获取项目基本信息
    return projectInfo
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
