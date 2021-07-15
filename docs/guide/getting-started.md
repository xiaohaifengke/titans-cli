---
sidebarDepth: 0
---
# 快速上手

## 安装
::: tip Node 版本要求
建议 Node.js v10 以上。你可以使用 n，nvm 或 nvm-windows 在同一台电脑中管理多个 Node 版本。
:::

可以使用下列任一命令安装这个新的包：
```sh
npm install -g otitan-cli
# OR
yarn global add otitan-cli
```
安装之后，你就可以在命令行中访问 `otitan` 命令。你可以通过简单运行 `otitan`，看看是否展示出了一份所有可用命令的帮助信息，来验证它是否安装成功。

## 必要的配置

因为流程中涉及到在Gitlab中创建仓库，和在Jenkins中创建任务，这些操作都需要权限认证。
在使用本工具之前，你必须提前设置一些参数以便于在整个流程中有权限进行任何操作。
工具中已经针对公司的现实环境预设了一些参数的默认值，除非Gitlab和Jenkins环境变了，否则这些参数应该不需要修改。
已经预设的参数和值如下所示：
```ini
repository=gitlab
repositoryProtocol=http
repositoryHostname=192.168.0.17
repositoryPort=80
repositoryApiBaseURL=/api/v4
jenkinsHostname=192.168.0.12
projectHostUsername=root
```
需要设置的参数如下：
```ini
namespace=xxxxxx
gitlabAPIToken=xxxxxx
jenkinsUser=xxxxxx
jenkinsAPIToken=xxxxxx
projectHostname=192.168.0.18
```
你可以在[这里](/config/)查阅每个参数的相关信息及获取方式，设置完这些参数后就可以享用`otitan create`命令提供的所有功能了。
> 其实不设置任何参数也是可以创建一个项目的，只不过不能创建远程仓库及Jenkins任务。

::: tip ~/.otitanrc
所有通过 `otitan config --set` 设置的参数均会以`ini`格式存储在用户的 home 目录下一个名为 `.otitanrc` 的文件里。
你可以通过 `otitan config` 命令修改这些参数，也可以直接编辑 `~/.otitanrc` 这个文件来修改这些参数。
:::

## 使用

### otitan create

运行以下命令来创建一个新项目：
```sh
otitan create demo-project
```

::: tip 提醒
otitan-cli有创建Jenkins任务的功能，任务的制品目前只支持部署在 `Linux` 服务器中，otitan-cli目前还不支持部署制品到 `Windows Server` 服务器。
:::

