'use strict'
const axios = require('axios')
const tempUrl = 'https://nanguan.top/cli-server/'
const baseURL = process.env.VC_CLI_BASE_URL || tempUrl

const request = axios.create({
  baseURL,
  timeout: 5000
})
request.interceptors.response.use(
  (res) => {
    return res.data
  },
  (err) => {
    return Promise.reject(err)
  }
)

module.exports = request
