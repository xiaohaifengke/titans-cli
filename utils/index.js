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
    console.log(e)
    spinner.fail('fn execute failed, reexecute again in five seconds')
    await sleep(5000)
    return waitFnloading(fn, message, ...args)
  }
}

function uppercaseFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.substring(1)
}


function stringToBase64(str){
  return Buffer.from(str).toString('base64')
}

function base64ToString(base64Str){
  return Buffer.from(base64Str,'base64').toString()
}

module.exports = {
  sleep,
  waitFnloading,
  uppercaseFirstLetter,
  stringToBase64,
  base64ToString
}
