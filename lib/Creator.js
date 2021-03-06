const inquirer = require('inquirer')
const downloadGitRepo = require('download-git-repo')
const util = require('util')
const path = require('path')
const fs = require('fs-extra')

const ora = require('ora')
const ncp = util.promisify(require('ncp').ncp)
const metalsmith = require('metalsmith')
const cons = require('consolidate')
const render = util.promisify(cons.ejs.render)
const chalk = require('chalk')

const { fetchRepoList, fetchRepoTagListByRepoId } = require('./request')
const { sleep, waitFnloading } = require('../utils')
const downloadRepo = util.promisify(downloadGitRepo)
const config = require('../config/index').get()
const repository = require('../repository/index')
const devops = require('../devops/index')
const execa = require('execa')

module.exports = class Creator {
  constructor(appName, targetDir) {
    this.name = appName
    this.target = targetDir
    this.tag = ''
    this.templateRepos = []
    this.cachePath = ''
  }
  
  async fetchTemplateRepos() {
    let templateRepos = await waitFnloading(fetchRepoList, 'waiting fetch template...\r\n')
    if (!templateRepos) return
    this.templateRepos = templateRepos
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
    this.tag = tag
    return tag
  }
  
  async downloadFromGitlab(repo, tag) {
    const repoName = repo.name
    const repository = `${config['repository']}:${config['repositoryProtocol']}://${config['repositoryHostname']}:${repo.path_with_namespace}${tag ? '#' + tag : ''}`
 
    const downloadDirectory = `${process.env[process.platform === 'darwin' ? 'HOME' : 'USERPROFILE']}/.otitan-cli`
    const destination = this.cachePath = path.resolve(downloadDirectory, `${repoName}@${tag}`)
    const spinner = ora({
      text: `The template repository ${repoName}@${tag} is downloading...`,
      color: 'cyan'
    }).start()
    
    try {
      if (!fs.pathExistsSync(destination)) {
        await downloadRepo(repository, destination)
      }
      spinner.succeed(`The template repository ${repoName}@${tag} download success.`)
    } catch (e) {
      console.log(e)
      spinner.fail(`The template repository ${repoName}@${tag} download failed.`)
    }
  }
  
  async compileTemplate() {
    if (!fs.pathExistsSync(path.join(this.cachePath, 'ask.js'))) {
      await ncp(this.cachePath, this.target)
    } else {
      await new Promise((resolve, reject) => {
        let spinner
        metalsmith(__dirname)
          .destination(this.target)
          .source(this.cachePath)
          .use(async(files, metalsmith, done) => {
            const questions = require(path.join(this.cachePath, 'ask.js'))
            questions.forEach(item => {
              if (item.name === 'repoName') {
                item.default = this.name
              }
            })
            const result = await inquirer.prompt(questions)
            result.repoTokenKey = this.name.split('-').map(item => {
              return `${item.charAt(0).toUpperCase()}${item.slice(1)}`
            }).join('-')
            result.templateVersion = this.tag
            const metadata = metalsmith.metadata()
            metadata.result = result
            Reflect.deleteProperty(files, 'ask.js')
            done()
          })
          .use((files, metalsmith, done) => {
            spinner = ora({
              text: `Project is generating...`,
              color: 'cyan'
            }).start()
            const { result: data } = metalsmith.metadata()
          
            Reflect.ownKeys(files).forEach(async file => {
              if (file.includes('.js') || file.includes('Jenkinsfile') || file.includes('.env.')) {
                let contents = files[file].contents.toString()
                if (/<%=\s*.+\s*%>/.test(contents)) {
                  contents = await render(contents, data)
                  files[file].contents = Buffer.from(contents)
                }
              }
            })
            done()
          })
          .build((err) => {
            if (err) {
              spinner.fail('Failed to create project')
              reject()
            } else {
              spinner.succeed(`Successfully created project ${chalk.yellow(this.name)}.`)
              resolve()
            }
          })
      })
    }
  }
  
  async initGitRepository() {
    const spinner = ora({
      text: 'Initializing git repository...'
    }).start()
    try {
      await execa('git init', [this.target])
      await execa.command('git add .', { cwd: this.target })
      await execa('git commit -m', ["Initial commit"], { cwd: this.target })
      spinner.succeed('Initializing git repository...')
    } catch (e) {
      console.log('initGitRepository: ', e)
      spinner.fail('Initializing git repository...')
    }
  }
  
  async installDependencies() {
    try {
      console.log('Installing dependencies. This might take a while...')
      const subprocess = execa('npm install', { cwd: this.target })
      subprocess.stdout.pipe(process.stdout)
      await subprocess
    } catch (e) {
      console.log('installDependencies: ', e)
    }
  }
  
  async createRepo() {
    const { createRepo } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'createRepo',
        message: `Need to create a repository for this project in gitlab?`,
        default: true
      }
    ])
    if (createRepo) {
      return await repository.createRepo(this)
    }
  }
  
  async configCICDEnv(repositoryInfo) {
    const { configCICD } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'configCICD',
        message: `Need to configure the CI/CD environment for this project?`,
        default: true
      }
    ])
    if (configCICD) {
      await devops.createCicd(this, repositoryInfo)
    }
    return false
  }
  
  async createProject() {
    let templateRepoName = await this.fetchTemplateRepos()
    const templateRepo = this.templateRepos.find(repo => repo.name === templateRepoName)
    let tag = await this.fetchTags(templateRepo.id)
    if (!tag) return
    await this.downloadFromGitlab(templateRepo, tag)
    await this.compileTemplate()
    await this.initGitRepository()
    await this.installDependencies()
  }
  
  async create() {
    try {
      await this.createProject()
      const repo = await this.createRepo()
      if (repo) this.configCICDEnv(repo)
    } catch (e) {
      console.log('Creator:', e)
    }
  }
}

