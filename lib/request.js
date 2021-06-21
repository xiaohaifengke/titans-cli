const axios = require('axios')
const { get } = require('../config/index')
const config = get()


const baseUrl = `${config['repositoryProtocol']}://${config['repositoryDomain']}:${config['repositoryPort']}${config['repositoryApiBaseURL']}`

const request = axios.create({
  baseURL: baseUrl
})

request.interceptors.response.use(response => response.data, error => console.log(error))

async function fetchRepoList() {
    return request.get(`/groups/${config['namespace']}/projects`)
}

async function fetchRepoTagListByRepoId(repoId){
  return request.get(`/projects/${repoId}/repository/tags`);
}

module.exports = {
  fetchRepoList,
  fetchRepoTagListByRepoId
}
