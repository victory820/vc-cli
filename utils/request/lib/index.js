'use strict'
const axios = require('axios')

// TODO 上线后这里地址需要更改
const baseURL = process.env.VC_CLI_BASE_URL || 'http://localhost:7001'

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
