const axios = require('axios')
const { get } = require('../config/index')
const config = get()


const baseUrl = `${config['repositoryProtocol']}://${config['repositoryHostname']}:${config['repositoryPort']}${config['repositoryApiBaseURL']}`

const request = axios.create({
  baseURL: baseUrl
})

request.interceptors.request.use(c => {
  c.headers['PRIVATE-TOKEN'] = config['gitlabAPIToken']
  return c
}, error => Promise.reject(error))

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
  return request.get(`/namespaces`);
}

/**
 * 获取用户所在的命名空间列表
 * 需要认证信息
 */
async function createGitlabProject(data){
  return request.post(`/projects`, data);
}

/**
 * Search for projects by name
 * @params {string} name: A string contained in the project name
 */
async function searchProjectsByName(name) {
  return request.get('/projects', {params: {search: name}})
}

/**
 * Adds a hook to a specified project.
 * @param data
 * @property {integer/string} data.projectId: The ID or URL-encoded path of the project
 * @property {string} data.hookUrl: The hook URL
 * @property {string} data.hookToken: Secret token to validate received payloads
 * @returns {Promise<AxiosResponse<any>>}
 */
async function addProjectHook(data) {
  return request.post(`/projects/${data.repoId}/hooks`, {
    url: data.hookUrl,
    token: data.hookToken,
    push_events: true
  })
}

module.exports = {
  fetchRepoList,
  fetchRepoTagListByRepoId,
  fetchNamespaces,
  createGitlabProject,
  searchProjectsByName,
  addProjectHook
}
