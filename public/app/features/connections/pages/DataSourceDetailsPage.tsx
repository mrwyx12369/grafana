import * as React from 'react';
import { useParams } from 'react-router-dom';

import { Alert, Badge } from '@grafana/ui';
import { PluginDetailsPage } from 'app/features/plugins/admin/components/PluginDetailsPage';
import { StoreState, useSelector, AppNotificationSeverity } from 'app/types';

import { ROUTES } from '../constants';

export function DataSourceDetailsPage() {
  const overrideNavId = 'standalone-plugin-page-/connections/add-new-connection';
  const { id } = useParams<{ id: string }>();
  const navIndex = useSelector((state: StoreState) => state.navIndex);
  const isConnectDataPageOverriden = Boolean(navIndex[overrideNavId]);
  const navId = isConnectDataPageOverriden ? overrideNavId : 'connections-add-new-connection'; // The nav id changes (gets a prefix) if it is overriden by a plugin

  return (
    <PluginDetailsPage
      pluginId={id}
      navId={navId}
      notFoundComponent={<NotFoundDatasource />}
      notFoundNavModel={{
        text: '未知数据源',
        subTitle: '找不到具有此 ID 的数据源。',
        active: true,
      }}
    />
  );
}

function NotFoundDatasource() {
  const { id } = useParams<{ id: string }>();

  return (
    <Alert severity={AppNotificationSeverity.Warning} title="">
      也许您输入了错误的 URL 或插件id <Badge text={id} color="orange" /> 不存在
      <br />
        要查看可用数据源的列表，请 <a href={ROUTES.AddNewConnection}>点击</a>.
    </Alert>
  );
}
