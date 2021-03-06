const { uppercaseFirstLetter, waitFnloading } = require('../utils')

const { fetchNamespaces, createGitlabProject, searchProjectsByName } = require('../lib/request')
const config = require('../config/index').get()
const chalk = require('chalk')
const url = require('url')
const inquirer = require('inquirer')
const execa = require('execa')
const ora = require('ora')

let cliOptions, repositoryOptions
async function createRepo(options) {
  cliOptions = options
  return await createGitlabRepo()
}

async function getNamespaces() {
  try {
    const res = await fetchNamespaces()
    return res
  } catch (e) {
    const gitlabApiTokenUrl = url.format({
      protocol: config['repositoryProtocol'],
      hostname: config['repositoryHostname'],
      port: config['repositoryPort'],
      pathname: '/profile/personal_access_tokens'
    })
    console.log(chalk.red(`Gitlab APIToken is invalid, please add a APIToken on this page: ${gitlabApiTokenUrl}`))
    throw e
  }
}

async function inquirerRepoOptions() {
  const namespaces = await getNamespaces()
  const namespaceMap = namespaces.reduce((result, item) => {
    const kind = item.kind
    if (result[kind]) {
      result[kind].push(item)
    } else {
      result[kind] = [item]
    }
    return result
  }, {})
  const namespaceChoices = Object.keys(namespaceMap).reduce((ret, key) => {
    ret.push(new inquirer.Separator(chalk.bgCyan.bold(`   ${uppercaseFirstLetter(key) + 's   '}`)))
    ret.push(...namespaceMap[key].map(item => ({...item, value: item.id})))
    return ret
  }, [])
  const questions = [
    {
      name: 'namespace_id',
      type: 'list',
      message: 'Select namespace',
      choices: namespaceChoices
    },
    {
      name: 'name',
      type: 'input',
      message: 'Input the repository name',
      validate: function (value) {
        if (value) {
          if (value.endsWith('.git') || value.endsWith('.atom') || !/^[a-zA-Z0-9_][a-zA-Z0-9_\-\.]*$/.test(value)) {
            return `project name contain only letters, digits, '_', '-' and '.'. Cannot start with '-', end in '.git' or end in '.atom'`
          }
          return true
        }
        return 'projectname is required'
      },
      default: cliOptions.name
    },
    {
      name: 'description',
      type: 'input',
      message: 'Input the repository description'
    },
    {
      name: 'visibility',
      type: 'list',
      message: 'Select the visibility level',
      choices: [
        {
          name: 'private (Project access must be granted explicitly for each user.)',
          comment: '?????? (???????????????????????????????????????????????????)',
          value: 'private'
        },
        {
          name: 'internal (The project can be cloned by any logged in user.)',
          value: 'internal'
        },
        {
          name: 'public (The project can be cloned without any authentication.)',
          value: 'public'
        },
      ]
    }
  ]
  const result = await inquirer.prompt(questions)
  result.namespaces = namespaces
  result.namespace = namespaces.find(item => item.id === result.namespace_id).name
  cliOptions.repositoryOptions = repositoryOptions = result
  return result
}

async function queryRepoIsExist(options) {
  const projects = await searchProjectsByName(options.name)
  const sameProject = projects.find(p => p.name === options.name && p.namespace.id === options.namespace_id)
  if (sameProject) {
    console.log(chalk.redBright(`A project with the same name under the same namespace(${options.namespace}) already exists.`))
    return true
  } else {
    return false
  }
}

async function pushCodeToRemote(repoInfo) {
  const spinner = ora({
    text: 'Push code to the remote repository...'
  }).start()
  try {
    await execa('git remote add origin', [repoInfo.ssh_url_to_repo], { cwd: cliOptions.target })
    await execa('git push origin master', { cwd: cliOptions.target })
    spinner.succeed()
  } catch (e) {
    spinner.fail()
    console.log('pushCodeToRemote: ', e)
  }
}

async function createGitlabRepo() {
  console.log(chalk.cyan('Start creating the repository on the gitlab...'))
  const options = await inquirerRepoOptions()
  const isExistRepo = await queryRepoIsExist(options)
  if (isExistRepo) return
  const createGitlabProjectOptions = {
    namespace_id: options.namespace_id,
    name: options.name,
    description: options.description,
    visibility: options.visibility
  }
  const repoInfo = await waitFnloading(createGitlabProject, 'creating the repository...', createGitlabProjectOptions)
  console.log(chalk.cyan('Repository was created successfully!'))
  console.log(`Repository info:`)
  console.log(`ssh_url_to_repo: ${chalk.green(repoInfo.ssh_url_to_repo)}`)
  console.log(`http_url_to_repo: ${chalk.green(repoInfo.http_url_to_repo)}`)
  console.log(`web_url: ${chalk.green(repoInfo.web_url)}`)
  console.log('')
  await pushCodeToRemote(repoInfo)
  return repoInfo
}

module.exports = {
  createRepo
}
