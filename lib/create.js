const path = require('path')
const fs = require('fs-extra')
const inquirer = require('inquirer')
const chalk = require('chalk')
const Creator = require('./Creator')

module.exports = async function (appName, options) {
  const cwd = process.cwd()
  const targetDir = path.join(cwd, appName)
  
  // When the directory exists, it is processed according to the interaction with the user
  if (fs.existsSync(targetDir)) {
    if (options.force) {
      await fs.remove(targetDir)
    } else {
      // let the user choose whether to overwrite or cancel
      let { action } = await inquirer.prompt([{
        type: 'list',
        name: 'action',
        message: `Target directory (${chalk.cyan(appName)}) already exists. Pick an action:`,
        choices: [
          { name: 'Overwrite', value: 'overwrite' },
          { name: 'Cancel', value: 'cancel' },
        ]
      }])
      
      if (action === 'overwrite') { //
        console.log(`  ${chalk.red('⚠ You are about to permanently delete this directory!')}`)
        console.log(`  ${chalk.red('This action cannot be undone. You will lose all files in this directory.')}`)
        console.log()
        const { overwrite } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'overwrite',
            message: `${chalk.redBright('Delete directory. Are you ABSOLUTELY SURE?')}`,
            prefix: `${chalk.red('?')}`,
            default: false
          }
        ])
        if (overwrite) {
          console.log('  Removing...')
          await fs.remove(targetDir)
          console.log('  The directory has been deleted!')
        } else {
          console.log(`  ${chalk.cyan('Cancelled!')}`)
          console.log(`  you can use other ${chalk.cyan('<app-name>')} to create a new project.`)
          console.log()
          return
        }
      } else if (action === 'cancel') {
        console.log(`  ${chalk.cyan('Cancelled!')}`)
        console.log(`  You can use other ${chalk.cyan('<app-name>')} to create a new project.`)
        return
      }
    }
  }
  
  // create project
  const creator = new Creator(appName, targetDir)
  creator.create()
}

