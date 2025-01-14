import { css } from '@emotion/css';
import React, { useCallback, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useMountedState } from 'react-use';
import { takeWhile } from 'rxjs/operators';

import { dateTimeFormatISO, GrafanaTheme2, LoadingState } from '@grafana/data';
import { getDataSourceSrv } from '@grafana/runtime';
import { Alert, Button, HorizontalGroup, useStyles2 } from '@grafana/ui';

import { previewAlertRule } from '../../api/preview';
import { useAlertQueriesStatus } from '../../hooks/useAlertQueriesStatus';
import { PreviewRuleRequest, PreviewRuleResponse } from '../../types/preview';
import { RuleFormType, RuleFormValues } from '../../types/rule-form';

import { PreviewRuleResult } from './PreviewRuleResult';

const fields: Array<keyof RuleFormValues> = ['type', 'dataSourceName', 'condition', 'queries', 'expression'];

export function PreviewRule(): React.ReactElement | null {
  const styles = useStyles2(getStyles);
  const [preview, onPreview] = usePreview();
  const { watch } = useFormContext<RuleFormValues>();
  const [type, condition, queries] = watch(['type', 'condition', 'queries']);
  const { allDataSourcesAvailable } = useAlertQueriesStatus(queries);

  if (type === RuleFormType.cloudRecording || type === RuleFormType.cloudAlerting) {
    return null;
  }

  const isPreviewAvailable = Boolean(condition) && allDataSourcesAvailable;

  return (
    <div className={styles.container}>
      <HorizontalGroup>
        {allDataSourcesAvailable && (
          <Button disabled={!isPreviewAvailable} type="button" variant="primary" onClick={onPreview}>
            预览警报
          </Button>
        )}
        {!allDataSourcesAvailable && (
          <Alert title="预览不可用" severity="warning">
            无法显示查询预览。查询中使用的某些数据源不可用。
          </Alert>
        )}
      </HorizontalGroup>
      <PreviewRuleResult preview={preview} />
    </div>
  );
}

export function usePreview(): [PreviewRuleResponse | undefined, () => void] {
  const [preview, setPreview] = useState<PreviewRuleResponse | undefined>();
  const { getValues } = useFormContext<RuleFormValues>();
  const isMounted = useMountedState();

  const onPreview = useCallback(() => {
    const values = getValues(fields);
    const request = createPreviewRequest(values);

    previewAlertRule(request)
      .pipe(takeWhile((response) => !isCompleted(response), true))
      .subscribe((response) => {
        if (!isMounted()) {
          return;
        }
        setPreview(response);
      });
  }, [getValues, isMounted]);

  return [preview, onPreview];
}

function createPreviewRequest(values: any[]): PreviewRuleRequest {
  const [type, dataSourceName, condition, queries, expression] = values;
  const dsSettings = getDataSourceSrv().getInstanceSettings(dataSourceName);
  if (!dsSettings) {
    throw new Error(`找不到${dataSourceName}的数据源设置`);
  }

  switch (type) {
    case RuleFormType.cloudAlerting:
      return {
        dataSourceUid: dsSettings.uid,
        dataSourceName,
        expr: expression,
      };

    case RuleFormType.grafana:
      return {
        grafana_condition: {
          condition,
          data: queries,
          now: dateTimeFormatISO(Date.now()),
        },
      };

    default:
      throw new Error(`警报类型 ${type} 预览版不支持。`);
  }
}

function isCompleted(response: PreviewRuleResponse): boolean {
  switch (response.data.state) {
    case LoadingState.Done:
    case LoadingState.Error:
      return true;
    default:
      return false;
  }
}

function getStyles(theme: GrafanaTheme2) {
  return {
    container: css`
      margin-top: ${theme.spacing(2)};
      max-width: ${theme.breakpoints.values.xxl}px;
    `,
  };
}
