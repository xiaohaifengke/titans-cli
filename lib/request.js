const axios = require('axios')

const request = axios.create({
  baseURL: 'http://192.168.0.17/api/v4'
})

request.interceptors.response.use(response => response.data, error => console.log(error))

async function fetchRepoList() {
    return request.get('/groups/frontend-cli/projects')
}

async function fetchRepoTagListByRepoId(repoId){
  return request.get(`/projects/${repoId}/repository/tags`);
}

module.exports = {
  fetchRepoList,
  fetchRepoTagListByRepoId
}