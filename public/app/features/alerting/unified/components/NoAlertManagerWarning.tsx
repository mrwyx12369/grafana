import React from 'react';

import { Alert } from '@grafana/ui';

import { AlertManagerDataSource } from '../utils/datasource';

interface Props {
  availableAlertManagers: AlertManagerDataSource[];
}

const NoAlertManagersAvailable = () => (
  <Alert title="未找到警报管理器" severity="warning">
    我们找不到任何外部警报管理器，您可能无法访问内置的系统警报管理器.
  </Alert>
);

const OtherAlertManagersAvailable = () => (
  <Alert title="未找到选定的警报管理器。" severity="warning">
    选定的警报管理器不再存在，或者您可能没有访问它的权限。您可以选择不同的下拉列表中的警报管理器。
  </Alert>
);

export const NoAlertManagerWarning = ({ availableAlertManagers }: Props) => {
  const hasOtherAMs = availableAlertManagers.length > 0;

  return <div>{hasOtherAMs ? <OtherAlertManagersAvailable /> : <NoAlertManagersAvailable />}</div>;
};
