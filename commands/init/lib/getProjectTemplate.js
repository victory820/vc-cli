const request = require('@vc-cli/request')

module.exports = function () {
  console.log('请求前。。。。')
  return request({
    url: '/project/template'
  })
}
