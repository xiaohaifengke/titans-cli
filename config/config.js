const path = require('path')
const configFilePath = path.join(`${process.env[process.platform === 'darwin' ? 'HOME' : 'USERPROFILE']}`, '/.otitanrc')
const defaultConfig = {
  repository: 'gitlab',
  namespace: 'frontend-cli',
  repositoryProtocol: 'http',
  repositoryHostname: '192.168.0.17',
  repositoryPort: '80',
  repositoryApiBaseURL: '/api/v4',
  jenkinsHostname: '192.168.0.12',
  projectHostUsername: 'root'
}

module.exports = {
  configFilePath,
  defaultConfig
}
