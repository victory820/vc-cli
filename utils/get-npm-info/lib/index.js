'use strict'

const { join: joinPath } = require('node:path/posix')
const { get } = require('axios')

async function getNpmInfo(npmName, registry) {
  if (!npmName) {
    return null
  }
  const registryUlr = registry || getDefaultRegistry()
  const npmUrl = joinPath(registryUlr, npmName)

  return get(npmUrl)
    .then((res) => {
      if (res.status === 200) {
        return res.data
      }
      return null
    })
    .catch((err) => {
      return Promise.reject(err)
    })
}
function getDefaultRegistry(isOriginal = false) {
  // 默认取国内镜像
  return isOriginal ? 'https://registry.npmjs.org' : 'https://registry.npmmirror.com'
}

module.exports = { getNpmInfo, getDefaultRegistry }
