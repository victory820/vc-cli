'use strict'
const path = require('node:path')

function formatPath(p) {
  if (p && typeof p === 'string') {
    if (path.sep === '/') {
      // liunx内核
      return p
    } else {
      // windows内核
      p = p.replace(/\\/g, '/')
    }
  }
  return p
}

module.exports = formatPath
