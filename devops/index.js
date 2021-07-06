const inquirer = require('inquirer')
const metalsmith = require('metalsmith')
const util = require('util')
const fs = require('fs')
const path = require('path')
const cons = require('consolidate')
const render = util.promisify(cons.ejs.render)
const axios = require('axios')
const FormData =require('form-data');
const config = require('../config/index').get()

async function createCicd() {
  const config = await configCICDEnv()
  const contents = await generateMultibranchConfigXML(config)
  await createMultibranchProjectByJenkinsApi(config, contents)
}

async function configCICDEnv() {
  let jenkinsHostname = config.jenkinsHostname
  
  const result = await inquirer.prompt([
    {
      type: 'input',
      name: 'jenkinsHostname',
      message: "Please enter the Jenkins IP? ",
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
      }
    },
  ])
  return result
}

async function generateMultibranchConfigXML(config) {
  const templatePath = path.resolve(__dirname, './config/multibranch-config-template.xml')
  const xmlStr = fs.readFileSync(templatePath, 'utf-8')
  const contents = await render(xmlStr, config)
  fs.writeFileSync(path.resolve(__dirname, './temp/multibranch-config-template.xml'), contents)
  return contents
}

async function createMultibranchProjectByJenkinsApi(config, contents) {
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
  const headers = {
    'Content-Type': 'application/xml', // 11780a619795a144d7edc33c2728b8acd3
    'Authorization': 'Basic RnJvbnRlbmQ6MTE3ODBhNjE5Nzk1YTE0NGQ3ZWRjMzNjMjcyOGI4YWNkMw=='
  }
  try {
    const res = await axios.post(`http://${config.cicdIP}:8080/createItem?name=testest`, contents, {headers})
    console.log('创建成功', res)
  } catch (e) {
    console.log(e.response.data, 'devops/index.js', e)
  }
}



module.exports = {
  createCicd
}
