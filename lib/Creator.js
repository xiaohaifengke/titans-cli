const inquirer = require('inquirer')
const downloadGitRepo = require('download-git-repo')
const util = require('util')
const path = require('path')

const { fetchRepoList, fetchRepoTagListByRepoId } = require('./request')
const { sleep, waitFnloading } = require('../utils')
const downloadRepo = util.promisify(downloadGitRepo)
module.exports = class Creator {
  constructor(appName, targetDir) {
    this.name = appName
    this.target = targetDir
    this.templateRepos = []
  }
  
  async fetchTemplateRepos() {
    let templateRepos = await waitFnloading(fetchRepoList, 'waiting fetch template...\r\n')
    if (!templateRepos) return
    this.templateRepos = templateRepos.map(({ id, name }) => ({ id, name }))
    let { templateRepo } = await inquirer.prompt([{
      type: 'list',
      name: 'templateRepo',
      message: `Please choose a template to create project`,
      choices: this.templateRepos.map(repo => repo.name)
    }])
    
    return templateRepo
  }
  
  async fetchTags(repoId) {
    let tags = await waitFnloading(fetchRepoTagListByRepoId, 'waiting fetch tags...\r\n', repoId)
    if (!tags) return
    if (tags.length === 0) {
      console.log(`${chalk.red('Please tag your template first.')}\r\n`)
      return
    } else {
      const latestTag = tags[tags.length - 1]
      tags = tags.map(tag => ({ ...tag, alias: tag.name })).concat({ ...latestTag, alias: 'latest' })
    }
    
    let { tag } = await inquirer.prompt([{
      type: 'list',
      name: 'tag',
      message: `Please choose a tag to create project`,
      choices: tags.map(({ name, alias }) => ({ name: alias, value: name }))
    }])
    
    return tag
  }
  
  async downloadFromGitlab(repo, tag) {
    const repository = `gitlab:http://192.168.0.17:liujh/${repo}${tag? '#' + tag : ''}`
    const destination = path.resolve(process.cwd(),`${repo}@${tag}`)
    await downloadRepo(repository, destination)
  }
  
  async create() {
    let templateRepo = await this.fetchTemplateRepos()
    const repo = this.templateRepos.find(repo => repo.name === templateRepo)
    let tag = await this.fetchTags(repo.id)
    if (!tag) return
    await this.downloadFromGitlab(templateRepo, tag)
  }
}

