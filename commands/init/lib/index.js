'use strict'

function init(projectName, options) {
  // 可接受自定义
  console.log('init command test', projectName, options, process.env.CLI_TARGET_PATH)
}

module.exports = init
