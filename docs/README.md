---
home: true
heroText: Otitan CLI
tagline: 🛠️ 公司新项目启动时的配置工具
actionText: 快速上手 →
actionLink: /guide/
features:
- title: 项目模板
  details: 统一流水线式的复用项目模板，通过交互的方式配置新项目必要的配置项，避免人工疏忽导致的遗漏等问题。
- title: 代码仓库
  details: 在生成新项目模板时可以一键创建代码仓库，并提交初始项目代码至仓库中，同时配置好Jenkins所需要的Webhook参数。
- title: devOps
  details: 自动创建Jenkins多分支流水线任务。在创建项目模板及仓库的过程中自动收集相关参数，在创建CI/CD任务时自动填入相关参数，简单快捷。
footer: MIT Licensed | Copyright © 2021-present Jhail
---
## 起步

安装：
```sh
npm install -g otitan-cli
# OR
yarn global add otitan-cli
```
创建一个项目：
```sh
otitan create demo-project
```
