const { stringToBase64 } = require('../utils')

const inquirer = require('inquirer')
const metalsmith = require('metalsmith')
const util = require('util')
const fs = require('fs')
const path = require('path')
const cons = require('consolidate')
const render = util.promisify(cons.ejs.render)
const axios = require('axios')
const chalk = require('chalk')
const FormData =require('form-data');
const config = require('../config/index').get()

let cliOptions, repositoryOptions
async function createCicd(options, repositoryInfo = {}) {
  console.log(chalk.cyan('Start configuring the environment for the CI/CD...'))
  cliOptions = options
  repositoryOptions= repositoryInfo
  const taskConfig = await configCICDEnv()
  const contents = await generateMultibranchConfigXML(taskConfig)
  await createMultibranchProjectByJenkinsApi(taskConfig, contents)
}

async function configCICDEnv() {
  let jenkinsHostname = config.jenkinsHostname
  
  const result = await inquirer.prompt([
    {
      type: 'input',
      name: 'taskname',
      message: "Please enter the task name? ",
      validate: function (value, result) {
        if (value) return true
        return 'taskname is required'
      },
      default: repositoryOptions.name
    },
    {
      type: 'input',
      name: 'jenkinsHostname',
      message: "Please enter the Jenkins server's hostname? ",
      validate: function (value, result) {
        if (value) return true
        return 'jenkinsHostname is required'
      },
      default: jenkinsHostname
    },
    {
      type: 'input',
      name: 'displayName',
      message: "Please enter the displayName for CI/CD task(WorkflowMultiBranchProject)? ",
      validate: function (value, result) {
        if (value) return true
        return 'displayName is required'
      }
    },
    {
      type: 'input',
      name: 'remote',
      message: "Please enter the project repository's SSH url ? ",
      validate: function (value, result) {
        if (value) return true
        return 'SSH url is required'
      },
      default: repositoryOptions.ssh_url_to_repo
    },
  ])
  return result
}

async function generateMultibranchConfigXML(taskConfig) {
  const templatePath = path.resolve(__dirname, './config/multibranch-config-template.xml')
  const xmlStr = fs.readFileSync(templatePath, 'utf-8')
  const contents = await render(xmlStr, taskConfig)
  return contents
}

async function createMultibranchProjectByJenkinsApi(taskConfig, contents) {
  /**
   * 假设使用 Frontend 这个用户
   * 先在 http://Jenkins_IP:8080/user/Frontend/configure 这个地址中的API Token添加一个token，并复制下来。假设token是 123456abcdefghijklmn789
   * 对 Frontend:123456abcdefghijklmn789 这个字符串进行base64编码得到 RnJvbnRlbmQ6MTIzNDU2YWJjZGVmZ2hpamtsbW43ODk=
   * 在调用Jenkins Api时在请求头中添加 'Authorization': 'Basic RnJvbnRlbmQ6MTIzNDU2YWJjZGVmZ2hpamtsbW43ODk=' 可以通过权限验证
   * 否则会报如下错误：
   * HTTP ERROR 403 No valid crumb was included in the request
   * URI:	/configureSecurity/configure
   * STATUS:	403
   * MESSAGE:	No valid crumb was included in the request
   * SERVLET:	Stapler
   */
  const authorization = stringToBase64(`${config.jenkinsUser}:${config.jenkinsAPIToken}`)
  const headers = {
    'Content-Type': 'application/xml',
    'Authorization': `Basic ${authorization}`
  }
  const res = await axios.post(`http://${taskConfig.jenkinsHostname}:8080/createItem`, contents, {headers, params: {name: taskConfig.taskname}})
  console.log(chalk.cyan('CI/CD multibranch workflow was created successfully!'))
}



module.exports = {
  createCicd
}
