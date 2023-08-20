import { css } from '@emotion/css';
import React from 'react';

import { dateTime, GrafanaTheme2 } from '@grafana/data';
import { Alert, Badge, LoadingPlaceholder, useStyles2 } from '@grafana/ui';
import { AlertmanagerAlert, Matcher } from 'app/plugins/datasource/alertmanager/types';

import { alertmanagerApi } from '../../api/alertmanagerApi';
import { isNullDate } from '../../utils/time';
import { AlertLabels } from '../AlertLabels';
import { DynamicTable, DynamicTableColumnProps, DynamicTableItemProps } from '../DynamicTable';

import { AmAlertStateTag } from './AmAlertStateTag';

interface Props {
  amSourceName: string;
  matchers: Matcher[];
}

export const SilencedInstancesPreview = ({ amSourceName, matchers }: Props) => {
  const { useGetAlertmanagerAlertsQuery } = alertmanagerApi;
  const styles = useStyles2(getStyles);
  const columns = useColumns();

  // By default the form contains an empty matcher - with empty name and value and = operator
  // We don't want to fetch previews for empty matchers as it results in all alerts returned
  const hasValidMatchers = matchers.some((matcher) => matcher.value && matcher.name);

  const {
    currentData: alerts = [],
    isFetching,
    isError,
  } = useGetAlertmanagerAlertsQuery(
    { amSourceName, filter: { matchers } },
    { skip: !hasValidMatchers, refetchOnMountOrArgChange: true }
  );

  const tableItemAlerts = alerts.map<DynamicTableItemProps<AlertmanagerAlert>>((alert) => ({
    id: alert.fingerprint,
    data: alert,
  }));

  return (
    <div>
      <h4 className={styles.title}>
        受影响的警报实例
        {tableItemAlerts.length > 0 ? (
          <Badge className={styles.badge} color="blue" text={tableItemAlerts.length} />
        ) : null}
      </h4>
      {!hasValidMatchers && <span>添加有效的匹配器以查看受影响的警报</span>}
      {isError && (
        <Alert title="预览不可用" severity="error">
          生成受影响的警报预览时出错。匹配器有效吗？
        </Alert>
      )}
      {isFetching && <LoadingPlaceholder text="加载..." />}
      {!isFetching && !isError && hasValidMatchers && (
        <div className={styles.table}>
          {tableItemAlerts.length > 0 ? (
            <DynamicTable
              items={tableItemAlerts}
              isExpandable={false}
              cols={columns}
              pagination={{ itemsPerPage: 10 }}
            />
          ) : (
            <span>未找到匹配的警报实例</span>
          )}
        </div>
      )}
    </div>
  );
};

function useColumns(): Array<DynamicTableColumnProps<AlertmanagerAlert>> {
  const styles = useStyles2(getStyles);

  return [
    {
      id: 'state',
      label: 'State',
      renderCell: function renderStateTag({ data }) {
        return <AmAlertStateTag state={data.status.state} />;
      },
      size: '120px',
      className: styles.stateColumn,
    },
    {
      id: 'labels',
      label: 'Labels',
      renderCell: function renderName({ data }) {
        return <AlertLabels labels={data.labels} size="sm" />;
      },
      size: 'auto',
    },
    {
      id: 'created',
      label: 'Created',
      renderCell: function renderSummary({ data }) {
        return <>{isNullDate(data.startsAt) ? '-' : dateTime(data.startsAt).format('YYYY-MM-DD HH:mm:ss')}</>;
      },
      size: '180px',
    },
  ];
}

const getStyles = (theme: GrafanaTheme2) => ({
  table: css`
    max-width: ${theme.breakpoints.values.lg}px;
  `,
  moreMatches: css`
    margin-top: ${theme.spacing(1)};
  `,
  title: css`
    display: flex;
    align-items: center;
  `,
  badge: css`
    margin-left: ${theme.spacing(1)};
  `,
  stateColumn: css`
    display: flex;
    align-items: center;
  `,
});
