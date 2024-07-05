'use strict'

const log = require('npmlog')

// 根据环境变量来设定log等级。等于verbose时为debug模式，展示debug日志；
log.level = process.env.CLI_LOG_LEVEL || 'info'

// 修改前缀
log.heading = 'vc-cli'

//  添加自定义命令-成功的提示
log.addLevel('success', 2000, { fg: 'green', bold: true })

module.exports = log
