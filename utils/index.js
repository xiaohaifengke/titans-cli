const ora = require('ora')

function sleep(interval) {
  return new Promise(resolve => setTimeout(resolve, interval))
}

async function waitFnloading(fn, message, ...args) {
  const spinner = ora({
    text: message,
    color: 'cyan'
  }).start()
  
  try {
    const res = await fn(...args)
    spinner.succeed()
    return res
  } catch (e) {
    spinner.fail('request failed, refetch again in five seconds')
    await sleep(5000)
    return waitFnloading(fn, message, ...args)
  }
}

module.exports = {
  sleep,
  waitFnloading
}
