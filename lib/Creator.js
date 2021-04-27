const inquirer = require('inquirer')
const ora = require('ora')

const { fetchRepoList } = require('./request')
const { sleep } = require('../utils')
module.exports = class Creator {
  constructor(appName, targetDir) {
    this.name = appName
    this.target = targetDir
  }
  
  async fetchRepo() {
    let repos = await wrapLoading(fetchRepoList, 'waiting fetch template...\r\n')
    let { repo } = await inquirer.prompt([{
      type: 'list',
      name: 'repo',
      message: `Please choose a template to create project`,
      choices: repos.map(repo => repo.name)
    }])
  
    console.log(repo)
  }
  
  create() {
    this.fetchRepo()
  }
}

async function wrapLoading(fn, message) {
  const spinner = ora({
    text: message,
    color: 'cyan'
  }).start()
  
  try {
    const res = await fn()
    spinner.succeed()
    return res
  } catch (e) {
    spinner.fail('request failed, refetch...')
  }
}
