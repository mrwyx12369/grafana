import { NavIndex } from '@grafana/data';

export const mockNavModel: NavIndex = {
  home: {
    id: 'home',
    text: '首页',
    icon: 'home-alt',
    url: '/',
  },
  dashboards: {
    id: 'dashboards',
    text: '仪表板',
    subTitle: '管理仪表板和文件夹',
    icon: 'apps',
    url: '/dashboards',
    children: [
      {
        id: 'manage-dashboards',
        text: '浏览',
        icon: 'sitemap',
        url: '/dashboards',
      },
      {
        id: 'playlists',
        text: '播放列表',
        icon: 'presentation-play',
        url: '/playlists',
      },
      {
        id: 'snapshots',
        text: '快照',
        icon: 'camera',
        url: '/dashboard/snapshots',
      },
      {
        id: 'library-panels',
        text: '库面板',
        icon: 'library-panel',
        url: '/library-panels',
      },
      {
        id: 'new-dashboard',
        text: '新仪表板',
        icon: 'plus',
        url: '/dashboard/new',
        hideFromTabs: true,
      },
      {
        id: 'new-folder',
        text: '新文件夹',
        subTitle: '创建新文件夹以组织仪表板',
        icon: 'plus',
        url: '/dashboards/folder/new',
        hideFromTabs: true,
      },
      {
        id: 'import',
        text: '导入',
        subTitle: '从文件或 Grafana.com 导入仪表板',
        icon: 'plus',
        url: '/dashboard/import',
        hideFromTabs: true,
      },
    ],
  },
  'manage-dashboards': {
    id: 'manage-dashboards',
    text: '浏览',
    icon: 'sitemap',
    url: '/dashboards',
    parentItem: {
      id: 'dashboards',
      text: '仪表板',
      subTitle: '管理仪表板和文件夹',
      icon: 'apps',
      url: '/dashboards',
      children: [
        {
          id: 'manage-dashboards',
          text: '浏览',
          icon: 'sitemap',
          url: '/dashboards',
        },
        {
          id: 'playlists',
          text: '播放列表',
          icon: 'presentation-play',
          url: '/playlists',
        },
        {
          id: 'snapshots',
          text: '快照',
          icon: 'camera',
          url: '/dashboard/snapshots',
        },
        {
          id: 'library-panels',
          text: '库面板',
          icon: 'library-panel',
          url: '/library-panels',
        },
        {
          id: 'new-dashboard',
          text: '新仪表板',
          icon: 'plus',
          url: '/dashboard/new',
          hideFromTabs: true,
        },
        {
          id: 'new-folder',
          text: '新文件夹',
          subTitle: '创建新文件夹以组织仪表板',
          icon: 'plus',
          url: '/dashboards/folder/new',
          hideFromTabs: true,
        },
        {
          id: 'import',
          text: '导入',
          subTitle: '从文件或 Grafana.com 导入仪表板',
          icon: 'plus',
          url: '/dashboard/import',
          hideFromTabs: true,
        },
      ],
    },
  },
  playlists: {
    id: 'playlists',
    text: '播放列表',
    icon: 'presentation-play',
    url: '/playlists',
    parentItem: {
      id: 'dashboards',
      text: '仪表板',
      subTitle: '管理仪表板和文件夹',
      icon: 'apps',
      url: '/dashboards',
      children: [
        {
          id: 'manage-dashboards',
          text: '浏览',
          icon: 'sitemap',
          url: '/dashboards',
        },
        {
          id: 'playlists',
          text: '播放列表',
          icon: 'presentation-play',
          url: '/playlists',
        },
        {
          id: 'snapshots',
          text: '快照',
          icon: 'camera',
          url: '/dashboard/snapshots',
        },
        {
          id: 'library-panels',
          text: '库面板',
          icon: 'library-panel',
          url: '/library-panels',
        },
        {
          id: 'new-dashboard',
          text: '新仪表板',
          icon: 'plus',
          url: '/dashboard/new',
          hideFromTabs: true,
        },
        {
          id: 'new-folder',
          text: '新文件夹',
          subTitle: '创建新文件夹以组织仪表板',
          icon: 'plus',
          url: '/dashboards/folder/new',
          hideFromTabs: true,
        },
        {
          id: 'import',
          text: '导入',
          subTitle: '从文件或 Grafana.com 导入仪表板',
          icon: 'plus',
          url: '/dashboard/import',
          hideFromTabs: true,
        },
      ],
    },
  },
  snapshots: {
    id: 'snapshots',
    text: '快照',
    icon: 'camera',
    url: '/dashboard/snapshots',
    parentItem: {
      id: 'dashboards',
      text: '仪表板',
      subTitle: '管理仪表板和文件夹',
      icon: 'apps',
      url: '/dashboards',
      children: [
        {
          id: 'manage-dashboards',
          text: '浏览',
          icon: 'sitemap',
          url: '/dashboards',
        },
        {
          id: 'playlists',
          text: '播放列表',
          icon: 'presentation-play',
          url: '/playlists',
        },
        {
          id: 'snapshots',
          text: '快照',
          icon: 'camera',
          url: '/dashboard/snapshots',
        },
        {
          id: 'library-panels',
          text: '库面板',
          icon: 'library-panel',
          url: '/library-panels',
        },
        {
          id: 'new-dashboard',
          text: '新仪表板',
          icon: 'plus',
          url: '/dashboard/new',
          hideFromTabs: true,
        },
        {
          id: 'new-folder',
          text: '新文件夹',
          subTitle: '创建新文件夹以组织仪表板',
          icon: 'plus',
          url: '/dashboards/folder/new',
          hideFromTabs: true,
        },
        {
          id: 'import',
          text: '导入',
          subTitle: '从文件或 Grafana.com 导入仪表板',
          icon: 'plus',
          url: '/dashboard/import',
          hideFromTabs: true,
        },
      ],
    },
  },
  'library-panels': {
    id: 'library-panels',
    text: '库面板',
    icon: 'library-panel',
    url: '/library-panels',
    parentItem: {
      id: 'dashboards',
      text: '仪表板',
      subTitle: '管理仪表板和文件夹',
      icon: 'apps',
      url: '/dashboards',
      children: [
        {
          id: 'manage-dashboards',
          text: '浏览',
          icon: 'sitemap',
          url: '/dashboards',
        },
        {
          id: 'playlists',
          text: '播放列表',
          icon: 'presentation-play',
          url: '/playlists',
        },
        {
          id: 'snapshots',
          text: '快照',
          icon: 'camera',
          url: '/dashboard/snapshots',
        },
        {
          id: 'library-panels',
          text: '库面板',
          icon: 'library-panel',
          url: '/library-panels',
        },
        {
          id: 'new-dashboard',
          text: '新仪表板',
          icon: 'plus',
          url: '/dashboard/new',
          hideFromTabs: true,
        },
        {
          id: 'new-folder',
          text: '新文件夹',
          subTitle: '创建新文件夹以组织仪表板',
          icon: 'plus',
          url: '/dashboards/folder/new',
          hideFromTabs: true,
        },
        {
          id: 'import',
          text: '导入',
          subTitle: '从文件或 Grafana.com 导入仪表板',
          icon: 'plus',
          url: '/dashboard/import',
          hideFromTabs: true,
        },
      ],
    },
  },
  'new-dashboard': {
    id: 'new-dashboard',
    text: '新建仪表板',
    icon: 'plus',
    url: '/dashboard/new',
    hideFromTabs: true,
    parentItem: {
      id: 'dashboards',
      text: '仪表板',
      subTitle: '管理仪表板和文件夹',
      icon: 'apps',
      url: '/dashboards',
      children: [
        {
          id: 'manage-dashboards',
          text: '浏览',
          icon: 'sitemap',
          url: '/dashboards',
        },
        {
          id: 'playlists',
          text: '播放列表',
          icon: 'presentation-play',
          url: '/playlists',
        },
        {
          id: 'snapshots',
          text: '快照',
          icon: 'camera',
          url: '/dashboard/snapshots',
        },
        {
          id: 'library-panels',
          text: '库面板',
          icon: 'library-panel',
          url: '/library-panels',
        },
        {
          id: 'new-dashboard',
          text: 'New dashboard',
          icon: 'plus',
          url: '/dashboard/new',
          hideFromTabs: true,
        },
        {
          id: 'new-folder',
          text: '新文件夹',
          subTitle: '创建新文件夹以组织仪表板',
          icon: 'plus',
          url: '/dashboards/folder/new',
          hideFromTabs: true,
        },
        {
          id: 'import',
          text: '导入',
          subTitle: '从文件或 Grafana.com 导入仪表板',
          icon: 'plus',
          url: '/dashboard/import',
          hideFromTabs: true,
        },
      ],
    },
  },
  'new-folder': {
    id: 'new-folder',
    text: '新文件夹',
    subTitle: '创建新文件夹以组织仪表板',
    icon: 'plus',
    url: '/dashboards/folder/new',
    hideFromTabs: true,
    parentItem: {
      id: 'dashboards',
      text: '仪表板',
      subTitle: '管理仪表板和文件夹',
      icon: 'apps',
      url: '/dashboards',
      children: [
        {
          id: 'manage-dashboards',
          text: '浏览',
          icon: 'sitemap',
          url: '/dashboards',
        },
        {
          id: 'playlists',
          text: '播放列表',
          icon: 'presentation-play',
          url: '/playlists',
        },
        {
          id: 'snapshots',
          text: '快照',
          icon: 'camera',
          url: '/dashboard/snapshots',
        },
        {
          id: 'library-panels',
          text: '库面板',
          icon: 'library-panel',
          url: '/library-panels',
        },
        {
          id: 'new-dashboard',
          text: '新表板',
          icon: 'plus',
          url: '/dashboard/new',
          hideFromTabs: true,
        },
        {
          id: 'new-folder',
          text: '新文件夹',
          subTitle: '创建新文件夹以组织仪表板',
          icon: 'plus',
          url: '/dashboards/folder/new',
          hideFromTabs: true,
        },
        {
          id: 'import',
          text: '导入',
          subTitle: '从文件或 Grafana.com 导入仪表板',
          icon: 'plus',
          url: '/dashboard/import',
          hideFromTabs: true,
        },
      ],
    },
  },
  import: {
    id: 'import',
    text: '导入',
    subTitle: '从文件或 Grafana.com 导入仪表板',
    icon: 'plus',
    url: '/dashboard/import',
    hideFromTabs: true,
    parentItem: {
      id: 'dashboards',
      text: '仪表板',
      subTitle: '管理仪表板和文件夹',
      icon: 'apps',
      url: '/dashboards',
      children: [
        {
          id: 'manage-dashboards',
          text: '浏览',
          icon: 'sitemap',
          url: '/dashboards',
        },
        {
          id: 'playlists',
          text: '播放列表',
          icon: 'presentation-play',
          url: '/playlists',
        },
        {
          id: 'snapshots',
          text: '快照',
          icon: 'camera',
          url: '/dashboard/snapshots',
        },
        {
          id: 'library-panels',
          text: '库面板',
          icon: 'library-panel',
          url: '/library-panels',
        },
        {
          id: 'new-dashboard',
          text: '新仪表板',
          icon: 'plus',
          url: '/dashboard/new',
          hideFromTabs: true,
        },
        {
          id: 'new-folder',
          text: '新文件夹',
          subTitle: '创建新文件夹以组织仪表板',
          icon: 'plus',
          url: '/dashboards/folder/new',
          hideFromTabs: true,
        },
        {
          id: 'import',
          text: '导入',
          subTitle: '从文件或 Grafana.com 导入仪表板',
          icon: 'plus',
          url: '/dashboard/import',
          hideFromTabs: true,
        },
      ],
    },
  },
  'not-found': {
    text: '未找到页面',
    subTitle: '404错误',
    icon: 'exclamation-triangle',
  },
  explore: {
    id: 'explore',
    text: '探索数据',
    subTitle: '探索您的数据',
    icon: 'compass',
    url: '/explore',
  },
  alerting: {
    id: 'alerting',
    text: '警报规则g',
    subTitle: '警报规则和通知',
    icon: 'bell',
    url: '/alerting/list',
    children: [
      {
        id: 'alert-list',
        text: '警报规则',
        icon: 'list-ul',
        url: '/alerting/list',
      },
      {
        id: 'channels',
        text: '通知渠道',
        icon: 'comment-alt-share',
        url: '/alerting/notifications',
      },
    ],
  },
  'alert-list': {
    id: 'alert-list',
    text: '警报规则',
    icon: 'list-ul',
    url: '/alerting/list',
    parentItem: {
      id: 'alerting',
      text: '警报',
      subTitle: '警报规则和通知',
      icon: 'bell',
      url: '/alerting/list',
      children: [
        {
          id: 'alert-list',
          text: '警报规则',
          icon: 'list-ul',
          url: '/alerting/list',
        },
        {
          id: 'channels',
          text: '通知渠道',
          icon: 'comment-alt-share',
          url: '/alerting/notifications',
        },
      ],
    },
  },
  channels: {
    id: 'channels',
    text: '通知渠道',
    icon: 'comment-alt-share',
    url: '/alerting/notifications',
    parentItem: {
      id: 'alerting',
      text: '警报',
      subTitle: '警报规则和通知',
      icon: 'bell',
      url: '/alerting/list',
      children: [
        {
          id: 'alert-list',
          text: '警报规则',
          icon: 'list-ul',
          url: '/alerting/list',
        },
        {
          id: 'channels',
          text: '通知渠道',
          icon: 'comment-alt-share',
          url: '/alerting/notifications',
        },
      ],
    },
  },
  cfg: {
    id: 'cfg',
    text: '配置',
    subTitle: '组织机构: Main Org',
    icon: 'cog',
    url: '/datasources',
    children: [
      {
        id: 'datasources',
        text: '数据源',
        icon: 'database',
        url: '/datasources',
      },
      {
        id: 'users',
        text: 'Users',
        icon: 'user',
        url: '/org/users',
      },
      {
        id: 'teams',
        text: 'Teams',
        icon: 'users-alt',
        url: '/org/teams',
      },
      {
        id: 'plugins',
        text: 'Plugins',
        icon: 'plug',
        url: '/plugins',
      },
      {
        id: 'org-settings',
        text: 'Preferences',
        icon: 'sliders-v-alt',
        url: '/org',
      },
      {
        id: 'apikeys',
        text: 'API keys',
        icon: 'key-skeleton-alt',
        url: '/org/apikeys',
      },
    ],
  },
  datasources: {
    id: 'datasources',
    text: 'Data sources',
    icon: 'database',
    url: '/datasources',
    parentItem: {
      id: 'cfg',
      text: 'Configuration',
      subTitle: 'Organization: Main Org',
      icon: 'cog',
      url: '/datasources',
      children: [
        {
          id: 'datasources',
          text: 'Data sources',
          icon: 'database',
          url: '/datasources',
        },
        {
          id: 'users',
          text: 'Users',
          icon: 'user',
          url: '/org/users',
        },
        {
          id: 'teams',
          text: 'Teams',
          icon: 'users-alt',
          url: '/org/teams',
        },
        {
          id: 'plugins',
          text: 'Plugins',
          icon: 'plug',
          url: '/plugins',
        },
        {
          id: 'org-settings',
          text: 'Preferences',
          icon: 'sliders-v-alt',
          url: '/org',
        },
        {
          id: 'apikeys',
          text: 'API keys',
          icon: 'key-skeleton-alt',
          url: '/org/apikeys',
        },
      ],
    },
  },
  users: {
    id: 'users',
    text: 'Users',
    icon: 'user',
    url: '/org/users',
    parentItem: {
      id: 'cfg',
      text: 'Configuration',
      subTitle: 'Organization: Main Org',
      icon: 'cog',
      url: '/datasources',
      children: [
        {
          id: 'datasources',
          text: 'Data sources',
          icon: 'database',
          url: '/datasources',
        },
        {
          id: 'users',
          text: 'Users',
          icon: 'user',
          url: '/org/users',
        },
        {
          id: 'teams',
          text: 'Teams',
          icon: 'users-alt',
          url: '/org/teams',
        },
        {
          id: 'plugins',
          text: 'Plugins',
          icon: 'plug',
          url: '/plugins',
        },
        {
          id: 'org-settings',
          text: 'Preferences',
          icon: 'sliders-v-alt',
          url: '/org',
        },
        {
          id: 'apikeys',
          text: 'API keys',
          icon: 'key-skeleton-alt',
          url: '/org/apikeys',
        },
      ],
    },
  },
  teams: {
    id: 'teams',
    text: 'Teams',
    icon: 'users-alt',
    url: '/org/teams',
    parentItem: {
      id: 'cfg',
      text: 'Configuration',
      subTitle: 'Organization: Main Org',
      icon: 'cog',
      url: '/datasources',
      children: [
        {
          id: 'datasources',
          text: 'Data sources',
          icon: 'database',
          url: '/datasources',
        },
        {
          id: 'users',
          text: 'Users',
          icon: 'user',
          url: '/org/users',
        },
        {
          id: 'teams',
          text: 'Teams',
          icon: 'users-alt',
          url: '/org/teams',
        },
        {
          id: 'plugins',
          text: 'Plugins',
          icon: 'plug',
          url: '/plugins',
        },
        {
          id: 'org-settings',
          text: 'Preferences',
          icon: 'sliders-v-alt',
          url: '/org',
        },
        {
          id: 'apikeys',
          text: 'API keys',
          icon: 'key-skeleton-alt',
          url: '/org/apikeys',
        },
      ],
    },
  },
  plugins: {
    id: 'plugins',
    text: 'Plugins',
    icon: 'plug',
    url: '/plugins',
    parentItem: {
      id: 'cfg',
      text: 'Configuration',
      subTitle: 'Organization: Main Org',
      icon: 'cog',
      url: '/datasources',
      children: [
        {
          id: 'datasources',
          text: 'Data sources',
          icon: 'database',
          url: '/datasources',
        },
        {
          id: 'users',
          text: 'Users',
          icon: 'user',
          url: '/org/users',
        },
        {
          id: 'teams',
          text: 'Teams',
          icon: 'users-alt',
          url: '/org/teams',
        },
        {
          id: 'plugins',
          text: 'Plugins',
          icon: 'plug',
          url: '/plugins',
        },
        {
          id: 'org-settings',
          text: 'Preferences',
          icon: 'sliders-v-alt',
          url: '/org',
        },
        {
          id: 'apikeys',
          text: 'API keys',
          icon: 'key-skeleton-alt',
          url: '/org/apikeys',
        },
      ],
    },
  },
  'org-settings': {
    id: 'org-settings',
    text: 'Preferences',
    icon: 'sliders-v-alt',
    url: '/org',
    parentItem: {
      id: 'cfg',
      text: 'Configuration',
      subTitle: 'Organization: Main Org',
      icon: 'cog',
      url: '/datasources',
      children: [
        {
          id: 'datasources',
          text: 'Data sources',
          icon: 'database',
          url: '/datasources',
        },
        {
          id: 'users',
          text: 'Users',
          icon: 'user',
          url: '/org/users',
        },
        {
          id: 'teams',
          text: 'Teams',
          icon: 'users-alt',
          url: '/org/teams',
        },
        {
          id: 'plugins',
          text: 'Plugins',
          icon: 'plug',
          url: '/plugins',
        },
        {
          id: 'org-settings',
          text: 'Preferences',
          icon: 'sliders-v-alt',
          url: '/org',
        },
        {
          id: 'apikeys',
          text: 'API keys',
          icon: 'key-skeleton-alt',
          url: '/org/apikeys',
        },
      ],
    },
  },
  apikeys: {
    id: 'apikeys',
    text: 'API keys',
    icon: 'key-skeleton-alt',
    url: '/org/apikeys',
    parentItem: {
      id: 'cfg',
      text: 'Configuration',
      subTitle: 'Organization: Main Org',
      icon: 'cog',
      url: '/datasources',
      children: [
        {
          id: 'datasources',
          text: 'Data sources',
          icon: 'database',
          url: '/datasources',
        },
        {
          id: 'users',
          text: 'Users',
          icon: 'user',
          url: '/org/users',
        },
        {
          id: 'teams',
          text: 'Teams',
          icon: 'users-alt',
          url: '/org/teams',
        },
        {
          id: 'plugins',
          text: 'Plugins',
          icon: 'plug',
          url: '/plugins',
        },
        {
          id: 'org-settings',
          text: 'Preferences',
          icon: 'sliders-v-alt',
          url: '/org',
        },
        {
          id: 'apikeys',
          text: 'API keys',
          icon: 'key-skeleton-alt',
          url: '/org/apikeys',
        },
      ],
    },
  },
  admin: {
    id: 'admin',
    text: 'Server Admin',
    subTitle: 'Manage all users and orgs',
    icon: 'shield',
    url: '/admin/users',
    hideFromTabs: true,
    children: [
      {
        id: 'global-users',
        text: 'Users',
        icon: 'user',
        url: '/admin/users',
      },
      {
        id: 'global-orgs',
        text: 'Orgs',
        icon: 'building',
        url: '/admin/orgs',
      },
      {
        id: 'server-settings',
        text: 'Settings',
        icon: 'sliders-v-alt',
        url: '/admin/settings',
      },
      {
        id: 'upgrading',
        text: 'Stats and license',
        icon: 'unlock',
        url: '/admin/upgrading',
      },
    ],
  },
  'global-users': {
    id: 'global-users',
    text: 'Users',
    icon: 'user',
    url: '/admin/users',
    parentItem: {
      id: 'admin',
      text: 'Server Admin',
      subTitle: 'Manage all users and orgs',
      icon: 'shield',
      url: '/admin/users',
      hideFromTabs: true,
      children: [
        {
          id: 'global-users',
          text: 'Users',
          icon: 'user',
          url: '/admin/users',
        },
        {
          id: 'global-orgs',
          text: 'Orgs',
          icon: 'building',
          url: '/admin/orgs',
        },
        {
          id: 'server-settings',
          text: 'Settings',
          icon: 'sliders-v-alt',
          url: '/admin/settings',
        },
        {
          id: 'upgrading',
          text: 'Stats and license',
          icon: 'unlock',
          url: '/admin/upgrading',
        },
      ],
    },
  },
  'global-orgs': {
    id: 'global-orgs',
    text: 'Orgs',
    icon: 'building',
    url: '/admin/orgs',
    parentItem: {
      id: 'admin',
      text: 'Server Admin',
      subTitle: 'Manage all users and orgs',
      icon: 'shield',
      url: '/admin/users',
      hideFromTabs: true,
      children: [
        {
          id: 'global-users',
          text: 'Users',
          icon: 'user',
          url: '/admin/users',
        },
        {
          id: 'global-orgs',
          text: 'Orgs',
          icon: 'building',
          url: '/admin/orgs',
        },
        {
          id: 'server-settings',
          text: 'Settings',
          icon: 'sliders-v-alt',
          url: '/admin/settings',
        },
        {
          id: 'upgrading',
          text: 'Stats and license',
          icon: 'unlock',
          url: '/admin/upgrading',
        },
      ],
    },
  },
  'support-bundles': {
    id: 'support-bundles',
    text: 'Support bundles',
    icon: 'sliders-v-alt',
    url: '/support-bundles',
  },
  'server-settings': {
    id: 'server-settings',
    text: 'Settings',
    icon: 'sliders-v-alt',
    url: '/admin/settings',
    parentItem: {
      id: 'admin',
      text: 'Server Admin',
      subTitle: 'Manage all users and orgs',
      icon: 'shield',
      url: '/admin/users',
      hideFromTabs: true,
      children: [
        {
          id: 'global-users',
          text: 'Users',
          icon: 'user',
          url: '/admin/users',
        },
        {
          id: 'global-orgs',
          text: 'Orgs',
          icon: 'building',
          url: '/admin/orgs',
        },
        {
          id: 'server-settings',
          text: 'Settings',
          icon: 'sliders-v-alt',
          url: '/admin/settings',
        },
        {
          id: 'upgrading',
          text: 'Stats and license',
          icon: 'unlock',
          url: '/admin/upgrading',
        },
      ],
    },
  },
  upgrading: {
    id: 'upgrading',
    text: 'Stats and license',
    icon: 'unlock',
    url: '/admin/upgrading',
    parentItem: {
      id: 'admin',
      text: 'Server Admin',
      subTitle: 'Manage all users and orgs',
      icon: 'shield',
      url: '/admin/users',
      hideFromTabs: true,
      children: [
        {
          id: 'global-users',
          text: 'Users',
          icon: 'user',
          url: '/admin/users',
        },
        {
          id: 'global-orgs',
          text: 'Orgs',
          icon: 'building',
          url: '/admin/orgs',
        },
        {
          id: 'server-settings',
          text: 'Settings',
          icon: 'sliders-v-alt',
          url: '/admin/settings',
        },
        {
          id: 'upgrading',
          text: 'Stats and license',
          icon: 'unlock',
          url: '/admin/upgrading',
        },
      ],
    },
  },
  profile: {
    id: 'profile',
    text: 'admin',
    img: '/avatar/46d229b033af06a191ff2267bca9ae56',
    url: '/profile',
    children: [
      {
        id: 'profile-settings',
        text: 'Preferences',
        icon: 'sliders-v-alt',
        url: '/profile',
      },
      {
        id: 'change-password',
        text: 'Change password',
        icon: 'lock',
        url: '/profile/password',
      },
      {
        id: 'sign-out',
        text: 'Sign out',
        icon: 'arrow-from-right',
        url: '/logout',
        target: '_self',
        hideFromTabs: true,
      },
    ],
  },
  'profile-settings': {
    id: 'profile-settings',
    text: 'Preferences',
    icon: 'sliders-v-alt',
    url: '/profile',
    parentItem: {
      id: 'profile',
      text: 'admin',
      img: '/avatar/46d229b033af06a191ff2267bca9ae56',
      url: '/profile',
      children: [
        {
          id: 'profile-settings',
          text: 'Preferences',
          icon: 'sliders-v-alt',
          url: '/profile',
        },
        {
          id: 'change-password',
          text: 'Change password',
          icon: 'lock',
          url: '/profile/password',
        },
        {
          id: 'sign-out',
          text: 'Sign out',
          icon: 'arrow-from-right',
          url: '/logout',
          target: '_self',
          hideFromTabs: true,
        },
      ],
    },
  },
  'change-password': {
    id: 'change-password',
    text: 'Change password',
    icon: 'lock',
    url: '/profile/password',
    parentItem: {
      id: 'profile',
      text: 'admin',
      img: '/avatar/46d229b033af06a191ff2267bca9ae56',
      url: '/profile',
      children: [
        {
          id: 'profile-settings',
          text: 'Preferences',
          icon: 'sliders-v-alt',
          url: '/profile',
        },
        {
          id: 'change-password',
          text: 'Change password',
          icon: 'lock',
          url: '/profile/password',
        },
        {
          id: 'sign-out',
          text: 'Sign out',
          icon: 'arrow-from-right',
          url: '/logout',
          target: '_self',
          hideFromTabs: true,
        },
      ],
    },
  },
  'sign-out': {
    id: 'sign-out',
    text: 'Sign out',
    icon: 'arrow-from-right',
    url: '/logout',
    target: '_self',
    hideFromTabs: true,
    parentItem: {
      id: 'profile',
      text: 'admin',
      img: '/avatar/46d229b033af06a191ff2267bca9ae56',
      url: '/profile',
      children: [
        {
          id: 'profile-settings',
          text: 'Preferences',
          icon: 'sliders-v-alt',
          url: '/profile',
        },
        {
          id: 'change-password',
          text: 'Change password',
          icon: 'lock',
          url: '/profile/password',
        },
        {
          id: 'sign-out',
          text: 'Sign out',
          icon: 'arrow-from-right',
          url: '/logout',
          target: '_self',
          hideFromTabs: true,
        },
      ],
    },
  },
  help: {
    id: 'help',
    text: 'Help',
    subTitle: 'Grafana v8.5.0-pre (f1c4da095b)',
    icon: 'question-circle',
    url: '#',
  },
};
