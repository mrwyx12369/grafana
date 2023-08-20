import React from 'react';

import { Alert } from '@grafana/ui';

export const LOCAL_STORAGE_KEY = 'grafana.legacyalerting.unifiedalertingpromo';

const DeprecationNotice = () => (
  <Alert severity="warning" title="系统旧版警报已弃用，并将在将来的版本中删除。">
    <p>
      您正在使用系统旧版警报，该功能自 Grafana 9.0 起已弃用。代码库现在保持为是并将在 Grafana 11.0 中删除。
      <br />
      我们建议尽快升级到格拉法纳警报。
    </p>
    <p>
      See{' '}
      <a href="https://grafana.com/docs/grafana/latest/alerting/migrating-alerts/">
        如何升级到系统警报
      </a>{' '}
      to learn more.
    </p>
  </Alert>
);

export { DeprecationNotice };
