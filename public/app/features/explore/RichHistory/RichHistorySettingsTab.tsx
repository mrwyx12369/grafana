import { css } from '@emotion/css';
import React from 'react';

import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { useStyles2, Select, Button, Field, InlineField, InlineSwitch, Alert } from '@grafana/ui';
import { notifyApp } from 'app/core/actions';
import appEvents from 'app/core/app_events';
import { createSuccessNotification } from 'app/core/copy/appNotification';
import { MAX_HISTORY_ITEMS } from 'app/core/history/RichHistoryLocalStorage';
import { dispatch } from 'app/store/store';

import { supportedFeatures } from '../../../core/history/richHistoryStorageProvider';
import { ShowConfirmModalEvent } from '../../../types/events';

export interface RichHistorySettingsProps {
  retentionPeriod: number;
  starredTabAsFirstTab: boolean;
  activeDatasourceOnly: boolean;
  onChangeRetentionPeriod: (option: SelectableValue<number>) => void;
  toggleStarredTabAsFirstTab: () => void;
  toggleactiveDatasourceOnly: () => void;
  deleteRichHistory: () => void;
}

const getStyles = (theme: GrafanaTheme2) => {
  return {
    container: css`
      font-size: ${theme.typography.bodySmall.fontSize};
    `,
    spaceBetween: css`
      margin-bottom: ${theme.spacing(3)};
    `,
    input: css`
      max-width: 200px;
    `,
    bold: css`
      font-weight: ${theme.typography.fontWeightBold};
    `,
    bottomMargin: css`
      margin-bottom: ${theme.spacing(1)};
    `,
  };
};

const retentionPeriodOptions = [
  { value: 2, label: '2天' },
  { value: 5, label: '5天' },
  { value: 7, label: '1周' },
  { value: 14, label: '2周' },
];

export function RichHistorySettingsTab(props: RichHistorySettingsProps) {
  const {
    retentionPeriod,
    starredTabAsFirstTab,
    activeDatasourceOnly,
    onChangeRetentionPeriod,
    toggleStarredTabAsFirstTab,
    toggleactiveDatasourceOnly,
    deleteRichHistory,
  } = props;
  const styles = useStyles2(getStyles);
  const selectedOption = retentionPeriodOptions.find((v) => v.value === retentionPeriod);

  const onDelete = () => {
    appEvents.publish(
      new ShowConfirmModalEvent({
        title: '删除',
        text: '是否确实要永久删除查询历史记录？',
        yesText: '确定',
        icon: 'trash-alt',
        onConfirm: () => {
          deleteRichHistory();
          dispatch(notifyApp(createSuccessNotification('已删除查询历史记录')));
        },
      })
    );
  };

  return (
    <div className={styles.container}>
      {supportedFeatures().changeRetention ? (
        <Field
          label="历史时间跨度"
          description={`选择系统保存查询历史记录的时间段。最多将存储 ${MAX_HISTORY_ITEMS} 个条目。`}
        >
          <div className={styles.input}>
            <Select value={selectedOption} options={retentionPeriodOptions} onChange={onChangeRetentionPeriod}></Select>
          </div>
        </Field>
      ) : (
        <Alert severity="info" title="历史时间跨度">
          系统将保留条目 {selectedOption?.label}.
        </Alert>
      )}
      <InlineField
        label="将默认活动选项卡从“查询历史记录”更改为“已加星标”"
        className={styles.spaceBetween}
      >
        <InlineSwitch
          id="explore-query-history-settings-default-active-tab"
          value={starredTabAsFirstTab}
          onChange={toggleStarredTabAsFirstTab}
        />
      </InlineField>
      {supportedFeatures().onlyActiveDataSource && (
        <InlineField
          label="仅显示对“探索”中当前处于活动状态的数据源的查询"
          className={styles.spaceBetween}
        >
          <InlineSwitch
            id="explore-query-history-settings-data-source-behavior"
            value={activeDatasourceOnly}
            onChange={toggleactiveDatasourceOnly}
          />
        </InlineField>
      )}
      {supportedFeatures().clearHistory && (
        <div>
          <div className={styles.bold}>清除查询历史记录</div>
          <div className={styles.bottomMargin}>永久删除所有查询历史记录。</div>
          <Button variant="destructive" onClick={onDelete}>
            清除查询历史记录
          </Button>
        </div>
      )}
    </div>
  );
}
