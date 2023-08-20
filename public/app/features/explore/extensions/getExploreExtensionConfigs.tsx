import React from 'react';

import { PluginExtensionPoints, type PluginExtensionLinkConfig } from '@grafana/data';
import { contextSrv } from 'app/core/core';
import { AccessControlAction } from 'app/types';

import { createExtensionLinkConfig, logWarning } from '../../plugins/extensions/utils';

import { AddToDashboardForm } from './AddToDashboard/AddToDashboardForm';
import { getAddToDashboardTitle } from './AddToDashboard/getAddToDashboardTitle';
import { type PluginExtensionExploreContext } from './ToolbarExtensionPoint';

export function getExploreExtensionConfigs(): PluginExtensionLinkConfig[] {
  try {
    return [
      createExtensionLinkConfig<PluginExtensionExploreContext>({
        title: '添加到仪表板',
        description: '使用“探索”中的查询和面板，并将其创建/添加到 dashboard',
        extensionPointId: PluginExtensionPoints.ExploreToolbarAction,
        icon: 'apps',
        category: 'Dashboards',
        configure: () => {
          const canAddPanelToDashboard =
            contextSrv.hasAccess(AccessControlAction.DashboardsCreate, contextSrv.isEditor) ||
            contextSrv.hasAccess(AccessControlAction.DashboardsWrite, contextSrv.isEditor);

          // hide option if user has insufficient permissions
          if (!canAddPanelToDashboard) {
            return undefined;
          }

          return {};
        },
        onClick: (_, { context, openModal }) => {
          openModal({
            title: getAddToDashboardTitle(),
            body: ({ onDismiss }) => <AddToDashboardForm onClose={onDismiss!} exploreId={context?.exploreId!} />,
          });
        },
      }),
    ];
  } catch (error) {
    logWarning(`由于以下原因，无法为“探索”配置扩展: "${error}"`);
    return [];
  }
}
