function sleep(interval) {
  return new Promise(resolve => setTimeout(resolve, interval))
}

async function wrapLoading(fn, message, options) {
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

module.exports = {
  sleep,
  wrapLoading
}
