const axios = require('axios')
const { get } = require('../config/index')
const config = get()


const baseUrl = `${config['repositoryProtocol']}://${config['repositoryHostname']}:${config['repositoryPort']}${config['repositoryApiBaseURL']}`

const request = axios.create({
  baseURL: baseUrl
})

request.interceptors.response.use(response => response.data, error => Promise.reject(error))

/**
 * 获取指定命名空间下的项目列表
 * 不需要认证信息
 */
async function fetchRepoList() {
    return request.get(`/groups/${config['namespace']}/projects`)
}

/**
 * 获取指定仓库的版本列表
 * 不需要认证信息
 */
async function fetchRepoTagListByRepoId(repoId){
  return request.get(`/projects/${repoId}/repository/tags`);
}

/**
 * 获取用户所在的命名空间列表
 * 需要认证信息
 */
async function fetchNamespaces(){
  return request.get(`/namespaces`, {headers: {'PRIVATE-TOKEN': config['gitlabAPIToken'] }});
}

/**
 * 获取用户所在的命名空间列表
 * 需要认证信息
 */
async function createGitlabProject(data){
  return request.post(`/projects`, data, {headers: {'PRIVATE-TOKEN': config['gitlabAPIToken'] }});
}

module.exports = {
  fetchRepoList,
  fetchRepoTagListByRepoId,
  fetchNamespaces,
  createGitlabProject
}
