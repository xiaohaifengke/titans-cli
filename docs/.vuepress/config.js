module.exports = {
  title: 'Otitan CLI',
  description: '🛠️ 公司项目模板、代码仓库、devOps环境的配置工具',
  base: '/titans-cli/',
  themeConfig: {
    displayAllHeaders: true,
    sidebarDepth: 2,
    repo: 'xiaohaifengke/titans-cli',
    nav: [
      { text: '首页', link: '/' },
      { text: '指南', link: '/guide/' },
      { text: '配置', link: '/config/' },
    ],
    sidebar: {
      '/guide/': [
        '',
        'getting-started'
      ],
      '/config/': [
        '',
        'config_ssh_to_server'
      ]
    }
  }
}

