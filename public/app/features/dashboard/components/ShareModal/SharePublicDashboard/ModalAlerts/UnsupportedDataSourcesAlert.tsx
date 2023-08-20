import { css } from '@emotion/css';
import cx from 'classnames';
import React from 'react';

import { GrafanaTheme2 } from '@grafana/data/src';
import { selectors as e2eSelectors } from '@grafana/e2e-selectors/src';
import { Alert, useStyles2 } from '@grafana/ui/src';

const selectors = e2eSelectors.pages.ShareDashboardModal.PublicDashboard;

export const UnsupportedDataSourcesAlert = ({ unsupportedDataSources }: { unsupportedDataSources: string }) => {
  const styles = useStyles2(getStyles);

  return (
    <Alert
      severity="warning"
      title="不支持的数据源"
      data-testid={selectors.UnsupportedDataSourcesWarningAlert}
      bottomSpacing={0}
    >
      <p className={styles.unsupportedDataSourceDescription}>
      此仪表板中存在公共仪表板不支持的数据源。使用这些数据的面板源可能无法正常工作： {unsupportedDataSources}.
      </p>
      <a
        href="https://grafana.com/docs/grafana/latest/dashboards/dashboard-public/"
        className={cx('text-link', styles.unsupportedDataSourceDescription)}
      >
        阅读有关支持的数据源的详细信息
      </a>
    </Alert>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  unsupportedDataSourceDescription: css`
    color: ${theme.colors.text.secondary};
    margin-bottom: ${theme.spacing(1)};
  `,
});
