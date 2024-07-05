const request = require('@vc-cli/request')

module.exports = function () {
  return request({
    url: '/project/template'
  })
}
