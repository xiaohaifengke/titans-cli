const inquirer = require('inquirer')
const metalsmith = require('metalsmith')
const util = require('util')
const fs = require('fs')
const path = require('path')
const cons = require('consolidate')
const render = util.promisify(cons.ejs.render)
const axios = require('axios')
const chalk = require('chalk')
const FormData = require('form-data')
const config = require('../config/index').get()
const { stringToBase64 } = require('../utils')
const { addProjectHook } = require('../lib/request')
const execa = require('execa')

let cliOptions, repositoryOptions

async function createCicd(options, repositoryInfo = {}) {
  console.log(chalk.cyan('Start configuring the environment for the CI/CD...'))
  cliOptions = options
  repositoryOptions = repositoryInfo
  const taskConfig = await configCICDEnv()
  const contents = await generateMultibranchConfigXML(taskConfig)
  await createMultibranchProjectByJenkinsApi(taskConfig, contents)
}

async function configCICDEnv() {
  let answers = {
    repoId: repositoryOptions.id,
    hookToken: cliOptions.name
  }
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
      default: config.jenkinsHostname
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
    {
      type: 'input',
      name: 'repoWebhookUrl',
      message: "Please enter the webhook url that is triggered when code is pushed to the repository?",
      validate: function (value, result) {
        if (value) return true
        return 'webhook url is required'
      },
      default: `http://${config.jenkinsHostname}:8080/generic-webhook-trigger/invoke`
    },
    {
      type: 'input',
      name: 'repoId',
      message: `Please enter the repository ID or URL-encoded path of the project? (${chalk.yellow('Not required!')}) `
    },
    {
      type: 'input',
      name: 'hookToken',
      message: `Please enter the project name? (${chalk.yellow('Not required!')}) `
    }
  ], answers)
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
   * URI:  /configureSecurity/configure
   * STATUS:  403
   * MESSAGE:  No valid crumb was included in the request
   * SERVLET:  Stapler
   */
  const authorization = stringToBase64(`${config.jenkinsUser}:${config.jenkinsAPIToken}`)
  const headers = {
    'Content-Type': 'application/xml',
    'Authorization': `Basic ${authorization}`
  }
  const res = await axios.post(`http://${taskConfig.jenkinsHostname}:8080/createItem`, contents, {
    headers,
    params: { name: taskConfig.taskname }
  })
  
  console.log(chalk.cyan('CI/CD multibranch workflow was created successfully!'))
  
  await uploadInitialNginxConf(taskConfig)
  
  // 为gitlab仓库添加webhook url
  let addHook = false
  const webhookTip = `1. 需要为代码仓库配置 Webhook URL和安全令牌，这样在提交代码时才会通过webhook触发jenkins对应的CI/CD任务。
  可能的配置地址为：Gitlab_IP/[namespace]/[project_name]/settings/integrations；`
  const webhookConfirmTip = `1. 已经为代码仓库配置 Webhook URL(${taskConfig.repoWebhookUrl})
  和安全令牌(${taskConfig.hookToken})，请确保此安全令牌和Jenkinsfile中的 triggers.GenericTrigger.token 的值一致，
  否则可能会出现提交代码后不能自动触发CI/CD任务的情况。`
  const dingdingRobotTip = `2. 如果要在Jenkins构建任务中集成钉钉通知，需要在Jenkins的系统配置中添加钉钉机器人id，
  名称及钉钉的webhook等信息，并在jenkinsfile中配置钉钉id。`
  if (taskConfig.hookToken && taskConfig.repoId) {
    try {
      await addProjectHook({
        repoId: taskConfig.repoId,
        hookUrl: taskConfig.repoWebhookUrl,
        hookToken: taskConfig.hookToken
      })
      addHook = true
    } catch (e) {
      //
    }
  }
  console.log(chalk.yellow(`Tips:
  ${addHook ? webhookConfirmTip : webhookTip}
  ${dingdingRobotTip}
  `))
}

async function uploadInitialNginxConf(taskConfig) {
  try {
    await execa.command(`ssh ${config.projectHostUsername}@${config.projectHostname} mkdir -vp /home/docker/${taskConfig.taskname}/nginx/conf`)
    await execa.command(`scp -o StrictHostKeyChecking=no ./config/default.conf root@192.168.0.18:/home/docker/${taskConfig.taskname}/nginx/conf`, {cwd: __dirname})
  } catch (e) {
    console.log(e)
    console.log('nginx初始配置上传失败，此错误不影响CI/CD任务，稍后请手动配置nginx即可...')
  }
}


module.exports = {
  createCicd
}
