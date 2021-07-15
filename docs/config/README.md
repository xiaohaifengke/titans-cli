---
sidebarDepth: 2
---
# 配置项

## 全局CLI配置
此 CLI 工具需要一些配置参数，其中一些参数提供了默认值，而另外一些需要你提前设置好才能保证 CLI 的正常运行。提供了默认值的参数可以通过`otitan config --set`设置一个自定义的值予以覆盖，
所有通过 `otitan config --set` 设置的参数均会以`ini`格式存储在用户的 home 目录下一个名为 `.otitanrc` 的文件里。
这里保存了 `otitan-cli` 所有的全局配置，你可以直接编辑这个文件修改这些参数。

你也可以使用 `otitan config` 命令来审查或修改全局的 CLI 配置。
## 无默认值的参数
::: warning 注意
若需要使用 CLI 的完整功能，必须提前设置好所有的无默认值的参数。
:::

### namespace
- Require: `true`

    Gitlab项目模板所属的命名空间。命名空间可以是群组名称也可以是个人的用户名。CLI 会获取到该命名空间下的所有项目作为列表，用户可以从中选择一项作为模板。
    > 目前公司的项目模板所属的命名空间是 `frontend-cli`

### gitlabAPIToken
- Require: `true`

    Gitlab中的个人访问令牌。个人访问令牌可以在访问那些需要权限认证的GitLab API时进行权限验证。
    对于未设置过的用户来说，通常需要添加一个。可以在 `http://Gitlab_IP/profile/personal_access_tokens` 这个页面中添加一个，然后保存到全局配置中。
    
    ::: tip 提醒
    生成的令牌只会在刚生成时显示，刷新页面后将不会再显示，请及时保存好该令牌。
    :::
    
### jenkinsUser
- Require: `true`

    Jenkins的登录用户名。在访问Jenkins Rest Api时需要进行权限认证，在构造认证信息时需要该用户名。

### jenkinsAPIToken
- Require: `true`

    Jenkins的 API Token 。在访问Jenkins Rest Api时需要进行权限认证，在构造认证信息时需要该 API Token 。
    可以在 `http://Jenkins_IP:8080/user/${jenkinsUser}/configure` 这个页面中给当前用户添加一个 API Token。
    
### projectHostname
- Require: `true`

    部署项目的服务器地址。该地址要和Jenkinsfile中通过 `SSH` 远程连接到的服务器的地址保持一致，同时也用于 CLI 工具向服务器的合适位置上传nginx配置。
    
    ::: tip 提醒
    因为Jenkins和CLI所在的机器上都需要远程连接到服务器，所以都要提前配置好机器使其可以用 `SSH` 命令连接服务器。  
    使用密钥认证机制远程登录linux的配置方式，可以参考[这里](/config/config_ssh_to_server)
    :::


## 有默认值的参数
### repository
- Require: `false`
- Default: `'gitlab'`

    仓库管理系统的类型，目前只支持`gitlab`,未来会考虑支持`github`和`gitee`。

### repositoryProtocol
- Require: `false`
- Default: `'http'`

    仓库管理系统服务的协议。
    
### repositoryHostname
- Require: `false`
- Default: `'192.168.0.17'`

    仓库管理系统服务所在的主机名。
    
### repositoryPort
- Require: `false`
- Default: `'80'`

    仓库管理系统服务的端口号。
    
### repositoryApiBaseURL
- Require: `false`
- Default: `'/api/v4'`

    仓库管理系统 API 的 base url。
    
    gitlab 中的 API 应该以 `api`和 API 版本开头。如 API 版本是 v4，则 API 的统一前缀应该是 `/api/v4`。API版本信息定义在 [`lib/api.rb`](https://gitlab.com/gitlab-org/gitlab-foss/-/blob/master/lib/api/api.rb) 。  
    可以查看 Gitlab 的 API 文档，地址参考： `http://Gitlab_IP/help/api/README.md#current-status`
    
### jenkinsHostname
- Require: `false`
- Default: `'192.168.0.12'`

    Jenkins服务所在的主机名。
    
### projectHostUsername
- Require: `false`
- Default: `'root'`

    项目需要部署的服务器的用户名。
