import { css, cx } from '@emotion/css';
import React from 'react';

import { GrafanaTheme2, TimeRange } from '@grafana/data';
import { Spinner, TimeRangeLabel, useStyles2 } from '@grafana/ui';

export interface Props {
  timeRange: TimeRange;
  className?: string;
  isDataLoading?: boolean;
  timeSelectionEnabled?: boolean;
  annotationsEnabled?: boolean;
}

export function SettingsSummary({
  className,
  isDataLoading = false,
  timeRange,
  timeSelectionEnabled,
  annotationsEnabled,
}: Props) {
  const styles = useStyles2(getStyles);

  return isDataLoading ? (
    <div className={cx(styles.summaryWrapper, className)}>
      <Spinner className={styles.summary} inline={true} size={14} />
    </div>
  ) : (
    <div className={cx(styles.summaryWrapper, className)}>
      <span className={styles.summary}>
        {'时间范围 = '}
        <TimeRangeLabel className={styles.timeRange} value={timeRange} />
      </span>
      <span className={styles.summary}>{`时间范围选取器 = ${timeSelectionEnabled ? '启用' : '禁用'}`}</span>
      <span className={styles.summary}>{`标注 = ${annotationsEnabled ? '显示' : '隐藏'}`}</span>
    </div>
  );
}

SettingsSummary.displayName = 'SettingsSummary';

const getStyles = (theme: GrafanaTheme2) => {
  return {
    summaryWrapper: css({
      display: 'flex',
    }),
    summary: css`
      label: collapsedText;
      margin-left: ${theme.spacing.gridSize * 2}px;
      font-size: ${theme.typography.bodySmall.fontSize};
      color: ${theme.colors.text.secondary};
    `,
    timeRange: css({
      display: 'inline-block',
    }),
  };
};
