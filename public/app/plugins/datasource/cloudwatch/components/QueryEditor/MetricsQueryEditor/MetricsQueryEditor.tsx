import React, { ChangeEvent, useCallback, useEffect, useState } from 'react';

import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { EditorField, EditorRow, InlineSelect, Space } from '@grafana/experimental';
import { ConfirmModal, Input, RadioButtonGroup } from '@grafana/ui';

import { CloudWatchDatasource } from '../../../datasource';
import useMigratedMetricsQuery from '../../../migrations/useMigratedMetricsQuery';
import {
  CloudWatchJsonData,
  CloudWatchMetricsQuery,
  CloudWatchQuery,
  MetricEditorMode,
  MetricQueryType,
  MetricStat,
} from '../../../types';
import { MetricStatEditor } from '../../shared/MetricStatEditor';

import { DynamicLabelsField } from './DynamicLabelsField';
import { MathExpressionQueryField } from './MathExpressionQueryField';
import { SQLBuilderEditor } from './SQLBuilderEditor';
import { SQLCodeEditor } from './SQLCodeEditor';

export interface Props extends QueryEditorProps<CloudWatchDatasource, CloudWatchQuery, CloudWatchJsonData> {
  query: CloudWatchMetricsQuery;
  extraHeaderElementLeft?: React.Dispatch<JSX.Element | undefined>;
  extraHeaderElementRight?: React.Dispatch<JSX.Element | undefined>;
}

const metricEditorModes: Array<SelectableValue<MetricQueryType>> = [
  { label: 'Metric Search', value: MetricQueryType.Search },
  { label: 'Metric Query', value: MetricQueryType.Query },
];
const editorModes = [
  { label: 'Builder', value: MetricEditorMode.Builder },
  { label: 'Code', value: MetricEditorMode.Code },
];

export const MetricsQueryEditor = (props: Props) => {
  const { query, datasource, extraHeaderElementLeft, extraHeaderElementRight, onChange } = props;
  const [showConfirm, setShowConfirm] = useState(false);
  const [sqlCodeEditorIsDirty, setSQLCodeEditorIsDirty] = useState(false);
  const migratedQuery = useMigratedMetricsQuery(query, props.onChange);

  const onEditorModeChange = useCallback(
    (newMetricEditorMode: MetricEditorMode) => {
      if (
        sqlCodeEditorIsDirty &&
        query.metricQueryType === MetricQueryType.Query &&
        query.metricEditorMode === MetricEditorMode.Code
      ) {
        setShowConfirm(true);
        return;
      }
      onChange({ ...query, metricEditorMode: newMetricEditorMode });
    },
    [setShowConfirm, onChange, sqlCodeEditorIsDirty, query]
  );

  useEffect(() => {
    extraHeaderElementLeft?.(
      <InlineSelect
        aria-label="Metric editor mode"
        value={metricEditorModes.find((m) => m.value === query.metricQueryType)}
        options={metricEditorModes}
        onChange={({ value }) => {
          onChange({ ...query, metricQueryType: value });
        }}
      />
    );

    extraHeaderElementRight?.(
      <>
        <RadioButtonGroup
          options={editorModes}
          size="sm"
          value={query.metricEditorMode}
          onChange={onEditorModeChange}
        />
        <ConfirmModal
          isOpen={showConfirm}
          title="Are you sure?"
          body="You will lose manual changes done to the query if you go back to the visual builder."
          confirmText="Yes, I am sure."
          dismissText="No, continue editing the query manually."
          icon="exclamation-triangle"
          onConfirm={() => {
            setShowConfirm(false);
            onChange({ ...query, metricEditorMode: MetricEditorMode.Builder });
          }}
          onDismiss={() => setShowConfirm(false)}
        />
      </>
    );

    return () => {
      extraHeaderElementLeft?.(undefined);
      extraHeaderElementRight?.(undefined);
    };
  }, [
    query,
    sqlCodeEditorIsDirty,
    datasource,
    onChange,
    extraHeaderElementLeft,
    extraHeaderElementRight,
    showConfirm,
    onEditorModeChange,
  ]);

  return (
    <>
      <Space v={0.5} />

      {query.metricQueryType === MetricQueryType.Search && (
        <>
          {query.metricEditorMode === MetricEditorMode.Builder && (
            <MetricStatEditor
              {...props}
              refId={query.refId}
              metricStat={query}
              onChange={(metricStat: MetricStat) => props.onChange({ ...query, ...metricStat })}
            ></MetricStatEditor>
          )}
          {query.metricEditorMode === MetricEditorMode.Code && (
            <MathExpressionQueryField
              expression={query.expression ?? ''}
              onChange={(expression) => props.onChange({ ...query, expression })}
              datasource={datasource}
            ></MathExpressionQueryField>
          )}
        </>
      )}
      {query.metricQueryType === MetricQueryType.Query && (
        <>
          {query.metricEditorMode === MetricEditorMode.Code && (
            <SQLCodeEditor
              region={query.region}
              sql={query.sqlExpression ?? ''}
              onChange={(sqlExpression) => {
                if (!sqlCodeEditorIsDirty) {
                  setSQLCodeEditorIsDirty(true);
                }
                props.onChange({ ...migratedQuery, sqlExpression });
              }}
              datasource={datasource}
            />
          )}

          {query.metricEditorMode === MetricEditorMode.Builder && (
            <>
              <SQLBuilderEditor query={query} onChange={props.onChange} datasource={datasource}></SQLBuilderEditor>
            </>
          )}
        </>
      )}
      <Space v={0.5} />
      <EditorRow>
        <EditorField
          label="ID"
          width={26}
          optional
          tooltip="ID 可用于引用数学表达式中的其他查询。ID 可以包含数字、字母和下划线，并且必须以小写字母开头。"
          invalid={!!query.id && !/^$|^[a-z][a-zA-Z0-9_]*$/.test(query.id)}
        >
          <Input
            id={`${query.refId}-cloudwatch-metric-query-editor-id`}
            onChange={(event: ChangeEvent<HTMLInputElement>) => onChange({ ...migratedQuery, id: event.target.value })}
            type="text"
            value={query.id}
          />
        </EditorField>

        <EditorField label="Period" width={26} tooltip="点之间的最小间隔（以秒为单位）。">
          <Input
            id={`${query.refId}-cloudwatch-metric-query-editor-period`}
            value={query.period || ''}
            placeholder="auto"
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onChange({ ...migratedQuery, period: event.target.value })
            }
          />
        </EditorField>

        <EditorField
          label="Label"
          width={26}
          optional
          tooltip="使用动态标注更改时间序列图例名称。有关详细信息，请参阅文档。"
        >
          <DynamicLabelsField
            width={52}
            label={migratedQuery.label ?? ''}
            onChange={(label) => props.onChange({ ...query, label })}
          ></DynamicLabelsField>
        </EditorField>
      </EditorRow>
    </>
  );
};
