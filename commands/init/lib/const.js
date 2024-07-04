const TYPE_PROJECT = 'project'
const TYPE_COMPONENT = 'component'

// 默认普通模板
const NORMAL_TYPE_TEMPLATE = 'normal'
const CUSTOM_TYPE_TEMPLATE = 'custom'

// 命令白名单
const WHITE_COMMANDS = ['pnpm', 'yarn', 'npm', 'cnpm']

const PROMPT_TYPE_MAP = {
  project: '项目',
  component: '组件'
}

module.exports = {
  TYPE_PROJECT,
  TYPE_COMPONENT,
  NORMAL_TYPE_TEMPLATE,
  CUSTOM_TYPE_TEMPLATE,
  WHITE_COMMANDS,
  PROMPT_TYPE_MAP
}
