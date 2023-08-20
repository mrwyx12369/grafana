import { css } from '@emotion/css';
import React from 'react';

import {
  DataSourceInstanceSettings,
  DataSourceJsonData,
  DataSourcePluginOptionsEditorProps,
  GrafanaTheme2,
  updateDatasourcePluginJsonDataOption,
} from '@grafana/data';
import { ConfigSection } from '@grafana/experimental';
import { Button, InlineField, InlineFieldRow, Input, useStyles2 } from '@grafana/ui';
import { DataSourcePicker } from 'app/features/datasources/components/picker/DataSourcePicker';

import { ConfigDescriptionLink } from '../ConfigDescriptionLink';
import { IntervalInput } from '../IntervalInput/IntervalInput';
import { TagMappingInput } from '../TraceToLogs/TagMappingInput';
import { getTimeShiftLabel, getTimeShiftTooltip, invalidTimeShiftError } from '../TraceToLogs/TraceToLogsSettings';

export interface TraceToMetricsOptions {
  datasourceUid?: string;
  tags?: Array<{ key: string; value: string }>;
  queries: TraceToMetricQuery[];
  spanStartTimeShift?: string;
  spanEndTimeShift?: string;
}

export interface TraceToMetricQuery {
  name?: string;
  query?: string;
}

export interface TraceToMetricsData extends DataSourceJsonData {
  tracesToMetrics?: TraceToMetricsOptions;
}

interface Props extends DataSourcePluginOptionsEditorProps<TraceToMetricsData> {}

export function TraceToMetricsSettings({ options, onOptionsChange }: Props) {
  const styles = useStyles2(getStyles);

  return (
    <div className={css({ width: '100%' })}>
      <InlineFieldRow className={styles.row}>
        <InlineField
          tooltip="Prometheus跟踪将导航到的普罗米修斯数据源"
          label="Data source"
          labelWidth={26}
        >
          <DataSourcePicker
            inputId="trace-to-metrics-data-source-picker"
            pluginId="prometheus"
            current={options.jsonData.tracesToMetrics?.datasourceUid}
            noDefault={true}
            width={40}
            onChange={(ds: DataSourceInstanceSettings) =>
              updateDatasourcePluginJsonDataOption({ onOptionsChange, options }, 'tracesToMetrics', {
                ...options.jsonData.tracesToMetrics,
                datasourceUid: ds.uid,
              })
            }
          />
        </InlineField>
        {options.jsonData.tracesToMetrics?.datasourceUid ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            fill="text"
            onClick={() => {
              updateDatasourcePluginJsonDataOption({ onOptionsChange, options }, 'tracesToMetrics', {
                ...options.jsonData.tracesToMetrics,
                datasourceUid: undefined,
              });
            }}
          >
            清除
          </Button>
        ) : null}
      </InlineFieldRow>

      <InlineFieldRow>
        <IntervalInput
          label={getTimeShiftLabel('start')}
          tooltip={getTimeShiftTooltip('start', '-2m')}
          value={options.jsonData.tracesToMetrics?.spanStartTimeShift || ''}
          onChange={(val) => {
            updateDatasourcePluginJsonDataOption({ onOptionsChange, options }, 'tracesToMetrics', {
              ...options.jsonData.tracesToMetrics,
              spanStartTimeShift: val,
            });
          }}
          placeholder={'-2m'}
          isInvalidError={invalidTimeShiftError}
        />
      </InlineFieldRow>

      <InlineFieldRow>
        <IntervalInput
          label={getTimeShiftLabel('end')}
          tooltip={getTimeShiftTooltip('end', '2m')}
          value={options.jsonData.tracesToMetrics?.spanEndTimeShift || ''}
          onChange={(val) => {
            updateDatasourcePluginJsonDataOption({ onOptionsChange, options }, 'tracesToMetrics', {
              ...options.jsonData.tracesToMetrics,
              spanEndTimeShift: val,
            });
          }}
          placeholder={'2m'}
          isInvalidError={invalidTimeShiftError}
        />
      </InlineFieldRow>

      <InlineFieldRow>
        <InlineField tooltip="将在指标查询中使用的标记" label="标签" labelWidth={26}>
          <TagMappingInput
            values={options.jsonData.tracesToMetrics?.tags ?? []}
            onChange={(v) =>
              updateDatasourcePluginJsonDataOption({ onOptionsChange, options }, 'tracesToMetrics', {
                ...options.jsonData.tracesToMetrics,
                tags: v,
              })
            }
          />
        </InlineField>
      </InlineFieldRow>

      {options.jsonData.tracesToMetrics?.queries?.map((query, i) => (
        <div key={i} className={styles.queryRow}>
          <InlineField label="连接标签" labelWidth={26} tooltip="链接查询的描述性标签">
            <Input
              label="连接标签"
              type="text"
              allowFullScreen
              value={query.name}
              width={40}
              onChange={(e) => {
                let newQueries = options.jsonData.tracesToMetrics?.queries.slice() ?? [];
                newQueries[i].name = e.currentTarget.value;
                updateDatasourcePluginJsonDataOption({ onOptionsChange, options }, 'tracesToMetrics', {
                  ...options.jsonData.tracesToMetrics,
                  queries: newQueries,
                });
              }}
            />
          </InlineField>
          <InlineField
            label="查询"
            labelWidth={10}
            tooltip="从跟踪导航到指标时将运行的 Prometheus 查询。使用`$__tags` 关键字"
            grow
          >
            <Input
              label="查询"
              type="text"
              allowFullScreen
              value={query.query}
              onChange={(e) => {
                let newQueries = options.jsonData.tracesToMetrics?.queries.slice() ?? [];
                newQueries[i].query = e.currentTarget.value;
                updateDatasourcePluginJsonDataOption({ onOptionsChange, options }, 'tracesToMetrics', {
                  ...options.jsonData.tracesToMetrics,
                  queries: newQueries,
                });
              }}
            />
          </InlineField>

          <Button
            variant="destructive"
            title="移除查询"
            icon="times"
            type="button"
            onClick={() => {
              let newQueries = options.jsonData.tracesToMetrics?.queries.slice();
              newQueries?.splice(i, 1);
              updateDatasourcePluginJsonDataOption({ onOptionsChange, options }, 'tracesToMetrics', {
                ...options.jsonData.tracesToMetrics,
                queries: newQueries,
              });
            }}
          />
        </div>
      ))}

      <Button
        variant="secondary"
        title="新增查询"
        icon="plus"
        type="button"
        onClick={() => {
          updateDatasourcePluginJsonDataOption({ onOptionsChange, options }, 'tracesToMetrics', {
            ...options.jsonData.tracesToMetrics,
            queries: [...(options.jsonData.tracesToMetrics?.queries ?? []), { query: '' }],
          });
        }}
      >
        新增查询
      </Button>
    </div>
  );
}

export const TraceToMetricsSection = ({ options, onOptionsChange }: DataSourcePluginOptionsEditorProps) => {
  return (
    <ConfigSection
      title="Trace to metrics"
      description={
        <ConfigDescriptionLink
          description="从跟踪范围导航到所选数据源的指标。"
          suffix={`${options.type}/#trace-to-metrics`}
          feature="trace to metrics"
        />
      }
      isCollapsible={true}
      isInitiallyOpen={true}
    >
      <TraceToMetricsSettings options={options} onOptionsChange={onOptionsChange} />
    </ConfigSection>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  infoText: css`
    padding-bottom: ${theme.spacing(2)};
    color: ${theme.colors.text.secondary};
  `,
  row: css`
    label: row;
    align-items: baseline;
  `,
  queryRow: css`
    label: queryRow;
    display: flex;
    flex-flow: wrap;
  `,
});
