const fs = require('fs')
const ini = require('ini')

const { configFile, defaultConfig } = require('./config')
let configFileContent = {}
if (fs.existsSync(configFile)) {
  configFileContent = ini.parse(fs.readFileSync(configFile, 'utf-8'))
}
const config = { ...defaultConfig, ...configFileContent }

module.exports = {
  get,
  set
}

function get(key) {
  if (key) {
    return config[key]
  }
  return config
}

function set(key, value) {
  config[key] = value
  configFileContent[key] = value
  fs.writeFileSync(configFile, ini.stringify(configFileContent))
}

