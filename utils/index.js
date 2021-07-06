const ora = require('ora')

/**
 * 休眠 {interval}
 * @param {number} interval 毫秒数
 */
function sleep(interval) {
  return new Promise(resolve => setTimeout(resolve, interval))
}

/**
 * 等待函数执行结束前显示loading
 * @param {function} fn 要执行的函数
 * @param {string} message loading 提示
 * @param args 传递给fn的参数
 * @returns {Promise<*|undefined>}
 */
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

function uppercaseFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.substring(1)
}

module.exports = {
  sleep,
  waitFnloading,
  uppercaseFirstLetter
}
