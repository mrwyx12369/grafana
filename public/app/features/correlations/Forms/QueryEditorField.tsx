import React from 'react';
import { Controller } from 'react-hook-form';
import { useAsync } from 'react-use';

import { CoreApp } from '@grafana/data';
import { getDataSourceSrv } from '@grafana/runtime';
import { Field, LoadingPlaceholder, Alert } from '@grafana/ui';

interface Props {
  dsUid?: string;
  name: string;
  invalid?: boolean;
  error?: string;
}

export const QueryEditorField = ({ dsUid, invalid, error, name }: Props) => {
  const {
    value: datasource,
    loading: dsLoading,
    error: dsError,
  } = useAsync(async () => {
    if (!dsUid) {
      return;
    }
    return getDataSourceSrv().get(dsUid);
  }, [dsUid]);

  const QueryEditor = datasource?.components?.QueryEditor;

  return (
    <Field
      label="查询"
      description={
        <span>
          定义单击链接时运行的查询。您可以使用{' '}
          <a
            href="https://grafana.com/docs/grafana/latest/panels-visualizations/configure-data-links/"
            target="_blank"
            rel="noreferrer"
          >
            variables
          </a>{' '}
          以访问特定字段值。
        </span>
      }
      invalid={invalid}
      error={error}
    >
      <Controller
        name={name}
        rules={{
          validate: {
            hasQueryEditor: () =>
              QueryEditor !== undefined || '所选目标数据源必须导出查询编辑器.',
          },
        }}
        render={({ field: { value, onChange } }) => {
          if (dsLoading) {
            return <LoadingPlaceholder text="Loading query editor..." />;
          }
          if (dsError) {
            return <Alert title="加载数据源时出错">无法加载所选数据源。</Alert>;
          }
          if (!datasource) {
            return (
              <Alert title="未选择数据源" severity="info">
                请先选择目标数据源。
              </Alert>
            );
          }
          if (!QueryEditor) {
            return <Alert title="数据源不导出查询编辑器。"></Alert>;
          }
          return (
            <>
              <QueryEditor
                onRunQuery={() => {}}
                app={CoreApp.Correlations}
                onChange={(value) => {
                  onChange(value);
                }}
                datasource={datasource}
                query={value}
              />
            </>
          );
        }}
      />
    </Field>
  );
};
