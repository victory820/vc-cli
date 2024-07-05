'use strict'

const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')

const { confirm, select, input } = require('@inquirer/prompts')
const fse = require('fs-extra')
const semver = require('semver')
const { globSync } = require('glob')
const ejs = require('ejs')
const pathExists = require('path-exists')

const Command = require('@vc-cli/command')
const log = require('@vc-cli/log')
const Package = require('@vc-cli/package')
const { spinner, sleep, spawnCompatibilityAsync } = require('@vc-cli/utils')

const {
  TYPE_PROJECT,
  TYPE_COMPONENT,
  NORMAL_TYPE_TEMPLATE,
  CUSTOM_TYPE_TEMPLATE,
  WHITE_COMMANDS,
  PROMPT_TYPE_MAP
} = require('./const')
const getProjectTemplate = require('./getProjectTemplate')

class InitCommand extends Command {
  init() {
    // 命令行中直接定义了项目名称
    this.cmdLineDefineProjectName = this._cmdArgs[0] || ''
    this.force = !!this._options.force
    log.verbose('命令行定义项目名：', this.cmdLineDefineProjectName)
    log.verbose('force：', this.force)
  }
  async exec() {
    try {
      // 准备阶段
      const projectInfo = await this.prepare()
      log.verbose('项目信息：', projectInfo)
      if (projectInfo) {
        this.projectInfo = projectInfo
        // 下载模版
        await this.downloadTemplate()
        // 模板安装
        await this.installTemplate()
      }
    } catch (error) {
      log.error(error.message)
    }
  }

  async ejsRender(options) {
    const cwdPath = process.cwd()
    const tempProjectInfo = this.projectInfo

    return new Promise((resolve, reject) => {
      try {
        const files = globSync('**', { cwd: cwdPath, ignore: options.ignore || '', nodir: true })
        Promise.all(
          files.map((file) => {
            const filePath = path.join(cwdPath, file)
            return new Promise((res, rej) => {
              ejs.renderFile(filePath, tempProjectInfo, {}, (err, str) => {
                if (err) {
                  rej(err)
                } else {
                  fse.writeFileSync(filePath, str)
                  res(str)
                }
              })
            })
          })
        ).then((res) => {
          resolve(res)
        })
      } catch (error) {
        reject(error)
      }
    })
  }

  checkCommand(cmd) {
    return WHITE_COMMANDS.includes(cmd)
  }

  async execCommand(cmdStr, errMsg) {
    let installResult
    if (cmdStr) {
      const tempCmds = cmdStr.split(' ')
      const cmd = tempCmds[0]
      if (!this.checkCommand(cmd)) {
        throw new Error('无效的命令：' + cmd)
      }
      const args = tempCmds.slice(1)
      installResult = await spawnCompatibilityAsync(cmd, args, {
        stdio: 'inherit',
        cwd: process.cwd()
      })
    }
    if (installResult !== 0) {
      throw new Error(errMsg)
    }
    return installResult
  }

  async installTemplateNormal() {
    // /Users/gulianghao/.vc-cli/template/node_modules/.store/vc-cli-template-v3@1.0.0/node_modules/vc-cli-template-v3
    const templatePath = path.resolve(
      this.templatePackage.cacheFilePath,
      'node_modules',
      this.templatePackage.cacheFilePathPrefix,
      'template'
    )
    const targetPath = process.cwd()
    const tempSpinner = spinner('正在安装模板...')
    await sleep()
    try {
      fse.ensureDirSync(templatePath)
      fse.ensureDirSync(targetPath)
      fse.copySync(templatePath, targetPath)
      log.success('拷贝成功')
    } catch (error) {
      throw error
    } finally {
      tempSpinner.stop(true)
    }

    const tempIgnore = this.selectedTemplate.ignore || []
    const ignore = [
      'node_modules/**',
      'public/**',
      'src/**',
      'pnpm-lock.yaml',
      '.eslintrc.cjs',
      '.prettierrc.json',
      'vite.config.js',
      ...tempIgnore
    ]
    await this.ejsRender({ ignore })
    const { installCommand, startCommand } = this.selectedTemplate
    await this.execCommand(installCommand, '安装依赖失败')
    await this.execCommand(startCommand, '启动过程失败')
  }

  async installTemplateCustom() {
    if (await this.templatePackage.exists()) {
      const rootFile = this.templatePackage.getRootFilePath()
      if (pathExists(rootFile)) {
        log.notice('开始执行自定义模板')
        const tempTemplatePackage = this.templatePackage
        const options = {
          ...this.selectedTemplate,
          targetPath: process.cwd(),
          // /Users/gulianghao/.vc-cli/template/node_modules/.store/vc-cli-template-custom@1.0.1/node_modules/vc-cli-template-custom/template
          sourcePath: path.resolve(
            tempTemplatePackage.newStoreDir,
            `${tempTemplatePackage.pkgName}@${tempTemplatePackage.pkgVersion}`,
            'node_modules',
            `${tempTemplatePackage.pkgName}`,
            'template'
          )
        }
        const code = `require('${rootFile}')(${JSON.stringify(options)})`
        await spawnCompatibilityAsync('node', ['-e', code], {
          stdio: 'inherit',
          cwd: process.cwd()
        })
        log.success('自定义模板安装成功')
      } else {
        throw new Error('自定义模板入口文件不存在')
      }
    }
  }

  async installTemplate() {
    if (this.selectedTemplate) {
      if (!this.selectedTemplate.type) {
        this.selectedTemplate.type = NORMAL_TYPE_TEMPLATE
      }
      const tempType = this.selectedTemplate.type
      if (tempType === NORMAL_TYPE_TEMPLATE) {
        await this.installTemplateNormal()
      } else if (tempType === CUSTOM_TYPE_TEMPLATE) {
        await this.installTemplateCustom()
      } else {
        throw new Error('无法识别的项目模板')
      }
    } else {
      throw new Error('项目模板信息不存在')
    }
  }

  async downloadTemplate() {
    const { projectTemplate } = this.projectInfo
    this.selectedTemplate = this.templateInfoList.find((item) => item.npmName === projectTemplate)
    const userHome = os.homedir()
    const targetPath = path.resolve(userHome, '.vc-cli', 'template')
    const storeDir = path.resolve(userHome, '.vc-cli', 'template', 'node_modules')
    const { npmName, version } = this.selectedTemplate
    const options = {
      targetPath,
      storeDir,
      pkgName: npmName,
      pkgVersion: version
    }
    const p = new Package(options)
    if (!(await p.exists())) {
      const tempSpinner = spinner('正在安装模板...')
      await sleep()
      try {
        await p.install()
        log.success('安装成功')
        this.templatePackage = p
      } catch (error) {
        throw error
      } finally {
        tempSpinner.stop(true)
      }
    } else {
      const tempSpinner = spinner('正在更新模板...')
      await sleep()
      try {
        await p.update()
        log.success('更新成功')
        this.templatePackage = p
      } catch (error) {
        throw error
      } finally {
        tempSpinner.stop(true)
      }
    }
  }

  async prepare() {
    // 如果模板没有就没必要在继续
    const tempTemplateInfoList = await getProjectTemplate()

    if (!tempTemplateInfoList || tempTemplateInfoList.length < 1) {
      throw new Error('项目模板不存在')
    }
    this.templateInfoList = tempTemplateInfoList
    const cwdPath = process.cwd()
    // 当前目录是否为空
    if (!this.isDirEmpty(cwdPath)) {
      // 如果目录下有内容
      let isContinue = true
      if (!this.force) {
        // 非强制处理，才询问
        isContinue = await confirm({
          message: '当前目录不为空是否继续创建项目？',
          default: false
        })
      }
      if (isContinue) {
        const isDelete = await confirm({
          message: '是否删除当前文件夹下所有文件？',
          default: false
        })
        if (isDelete) {
          const tempSpinner = spinner('正在清空目录...')
          await sleep()
          fse.emptyDirSync(cwdPath)
          tempSpinner.stop(true)
        }
      } else {
        return false
      }
    }
    return this.getProjectInfo()
  }

  async getProjectInfo() {
    function isValidName(v) {
      const reg = /^[a-zA-Z][\w-]{0,30}[a-zA-Z0-9]$/
      return reg.test(v)
    }

    let projectInfo = {}
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
    // 根据tag区分不同类型，展示内容只有下面对应的数据
    this.templateInfoList = this.templateInfoList.filter((item) => item.tag.includes(typeInfo))

    // 先获取命令行中指定的项目名称，如果不存在或者不合法，让用户输入
    let pkgName = this.cmdLineDefineProjectName
    if (!pkgName || !isValidName(pkgName)) {
      pkgName = await input({
        message: `请输入${PROMPT_TYPE_MAP[typeInfo]}名称`,
        default: '',
        validate: function (v) {
          // 首字符必须为英文字母；尾字符必须为英文或数字不能是符号；字符仅允许_-
          if (isValidName(v)) {
            return true
          } else {
            return '名称格式错误：仅以英文字母开头、英文或数字结尾、最多32个字符长度'
          }
        }
      })
    }
    const pkgVersion = await input({
      message: `请输入${PROMPT_TYPE_MAP[typeInfo]}版本号`,
      default: '0.0.1',
      validate: function (v) {
        if (semver.valid(v)) {
          return true
        } else {
          return '版本格式错误'
        }
      }
    })

    // 组件，才有描述信息
    const projectDesc = await input({
      message: '请输入描述信息',
      default: '',
      validate: function (v) {
        // 首字符必须为英文字母；尾字符必须为英文或数字不能是符号；字符仅允许_-
        if (v && v.length > 0) {
          return true
        } else {
          return '请输入描述信息'
        }
      }
    })

    const projectTemplate = await select({
      message: '请选择模板',
      default: '',
      choices: this.createTemplateChoices()
    })

    projectInfo = {
      typeInfo,
      pkgName,
      pkgVersion: pkgVersion,
      version: pkgVersion,
      projectTemplate,
      description: projectDesc
    }

    if (projectInfo.pkgName) {
      const kebabCase = require('kebab-case')
      projectInfo.className = kebabCase(projectInfo.pkgName)
    }

    // 获取项目基本信息
    return projectInfo
  }

  createTemplateChoices() {
    return this.templateInfoList.map((item) => ({
      name: item.name,
      value: item.npmName
    }))
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
