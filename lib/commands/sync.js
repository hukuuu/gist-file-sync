const fs = require('fs')
const path = require('path')
const { utf8 } = require('../constants')
const { fetchSpecialGist, getDescription } = require('../utils')
const moment = require('moment')
const push = require('./push')
const pull = require('./pull')

const getLocalFile = async pathname => {
  try {
    const stats = fs.statSync(pathname)
    return {
      mtime: stats.mtime,
      content: fs.readFileSync(pathname, utf8)
    }
  } catch (e) {
    return null
  }
}

const getRemoteFile = async (filename, log) => {
  log.start(`searching for ${filename}`)
  const gist = await fetchSpecialGist(log)
  const rFile = gist.files[filename]
  if (!rFile) {
    return null
  } else {
    return {
      content: rFile.content,
      mtime: getDescription(gist)[filename]
    }
  }
}

const sync = async (pathname, log) => {
  const local = await getLocalFile(pathname)

  if (!local) {
    log.info(`no local file ${pathname}`)
    return pull(pathname, log)
  }
  const filename = path.basename(pathname)
  const remote = await getRemoteFile(filename, log)

  if (!remote) {
    log.info(`no remote file ${filename}`)
    return push(pathname, log)
  }

  if (local.content === remote.content) {
    log.info(`files are identical`)
    return
  }

  if (moment(local.mtime).isAfter(moment(remote.mtime))) {
    // log.info(`local file is newer`)
    return push(pathname, log)
  } else {
    // log.info(`remote file is newer`)
    return pull(pathname, log)
  }
}

module.exports = sync
