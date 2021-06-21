const path = require('path')
const configFile = path.join(`${process.env[process.platform === 'darwin' ? 'HOME' : 'USERPROFILE']}`, '/.otitanrc')
const defaultConfig = {
  repository: 'gitlab',
  namespace: 'frontend-cli',
  repositoryProtocol: 'http',
  repositoryDomain: '192.168.0.17',
  repositoryPort: '80',
  repositoryApiBaseURL: '/api/v4'
}

module.exports = {
  configFile,
  defaultConfig
}
