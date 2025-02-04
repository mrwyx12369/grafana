import { css } from '@emotion/css';
import React, { useState } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { Button, CodeEditor, useStyles2 } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';
import { dashboardWatcher } from 'app/features/live/dashboard/dashboardWatcher';

import { getDashboardSrv } from '../../services/DashboardSrv';

import { SettingsPageProps } from './types';

export function JsonEditorSettings({ dashboard, sectionNav }: SettingsPageProps) {
  const [dashboardJson, setDashboardJson] = useState<string>(JSON.stringify(dashboard.getSaveModelClone(), null, 2));

  const onClick = async () => {
    await getDashboardSrv().saveJSONDashboard(dashboardJson);
    dashboardWatcher.reloadPage();
  };

  const styles = useStyles2(getStyles);
  const subTitle =
    '下面的 JSON 模型是定义仪表板的数据结构。这包括仪表板设置、面板设置、布局、查询等';

  return (
    <Page navModel={sectionNav} subTitle={subTitle}>
      <div className={styles.wrapper}>
        <CodeEditor
          value={dashboardJson}
          language="json"
          showMiniMap={true}
          showLineNumbers={true}
          onBlur={setDashboardJson}
          containerStyles={styles.codeEditor}
        />
        {dashboard.meta.canSave && (
          <div>
            <Button type="submit" onClick={onClick}>
              保存修改
            </Button>
          </div>
        )}
      </div>
    </Page>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  wrapper: css({
    display: 'flex',
    height: '100%',
    flexDirection: 'column',
    gap: theme.spacing(2),
  }),
  codeEditor: css({
    flexGrow: 1,
  }),
});
