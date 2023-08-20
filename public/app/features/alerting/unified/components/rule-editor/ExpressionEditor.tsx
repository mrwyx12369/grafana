import { css } from '@emotion/css';
import { noop } from 'lodash';
import React, { useCallback, useMemo } from 'react';
import { useAsync } from 'react-use';

import { CoreApp, DataQuery, DataSourcePluginContextProvider, GrafanaTheme2, LoadingState } from '@grafana/data';
import { getDataSourceSrv } from '@grafana/runtime';
import { Alert, Button, useStyles2 } from '@grafana/ui';
import { LokiQuery } from 'app/plugins/datasource/loki/types';
import { PromQuery } from 'app/plugins/datasource/prometheus/types';

import { CloudAlertPreview } from './CloudAlertPreview';
import { usePreview } from './PreviewRule';

export interface ExpressionEditorProps {
  value?: string;
  onChange: (value: string) => void;
  dataSourceName: string; // will be a prometheus or loki datasource
  showPreviewAlertsButton: boolean;
}

export const ExpressionEditor = ({
  value,
  onChange,
  dataSourceName,
  showPreviewAlertsButton = true,
}: ExpressionEditorProps) => {
  const styles = useStyles2(getStyles);

  const { mapToValue, mapToQuery } = useQueryMappers(dataSourceName);
  const dataQuery = mapToQuery({ refId: 'A', hide: false }, value);

  const {
    error,
    loading,
    value: dataSource,
  } = useAsync(() => {
    return getDataSourceSrv().get(dataSourceName);
  }, [dataSourceName]);

  const onChangeQuery = useCallback(
    (query: DataQuery) => {
      onChange(mapToValue(query));
    },
    [onChange, mapToValue]
  );

  const [alertPreview, onPreview] = usePreview();

  const onRunQueriesClick = async () => {
    onPreview();
  };

  if (loading || dataSource?.name !== dataSourceName) {
    return null;
  }

  const dsi = getDataSourceSrv().getInstanceSettings(dataSourceName);

  if (error || !dataSource || !dataSource?.components?.QueryEditor || !dsi) {
    const errorMessage = error?.message || '数据源插件不导出任何查询编辑器组件';
    return <div>由于以下原因无法加载查询编辑器： {errorMessage}</div>;
  }

  const previewLoaded = alertPreview?.data.state === LoadingState.Done;

  const QueryEditor = dataSource?.components?.QueryEditor;

  // The Preview endpoint returns the preview as a single-element array of data frames
  const previewDataFrame = alertPreview?.data?.series?.find((s) => s.name === 'evaluation results');
  // The preview API returns arrays with empty elements when there are no firing alerts
  const previewHasAlerts = previewDataFrame && previewDataFrame.fields.some((field) => field.values.length > 0);

  return (
    <>
      <DataSourcePluginContextProvider instanceSettings={dsi}>
        <QueryEditor
          query={dataQuery}
          queries={[dataQuery]}
          app={CoreApp.CloudAlerting}
          onChange={onChangeQuery}
          onRunQuery={noop}
          datasource={dataSource}
        />
      </DataSourcePluginContextProvider>
      {showPreviewAlertsButton && (
        <div className={styles.preview}>
          <Button
            type="button"
            onClick={onRunQueriesClick}
            disabled={alertPreview?.data.state === LoadingState.Loading}
          >
            预览警报
          </Button>
          {previewLoaded && !previewHasAlerts && (
            <Alert title="警报预览" severity="info" className={styles.previewAlert}>
              查询没有触发警报。
            </Alert>
          )}
          {previewHasAlerts && <CloudAlertPreview preview={previewDataFrame} />}
        </div>
      )}
    </>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  preview: css`
    padding: ${theme.spacing(2, 0)};
    max-width: ${theme.breakpoints.values.xl}px;
  `,
  previewAlert: css`
    margin: ${theme.spacing(1, 0)};
  `,
});

type QueryMappers<T extends DataQuery = DataQuery> = {
  mapToValue: (query: T) => string;
  mapToQuery: (existing: T, value: string | undefined) => T;
};

export function useQueryMappers(dataSourceName: string): QueryMappers {
  return useMemo(() => {
    const settings = getDataSourceSrv().getInstanceSettings(dataSourceName);

    switch (settings?.type) {
      case 'loki':
      case 'prometheus':
        return {
          mapToValue: (query: DataQuery) => (query as PromQuery | LokiQuery).expr,
          mapToQuery: (existing: DataQuery, value: string | undefined) => ({ ...existing, expr: value }),
        };
      default:
        throw new Error(`${dataSourceName} 不支持作为表达式编辑器`);
    }
  }, [dataSourceName]);
}
