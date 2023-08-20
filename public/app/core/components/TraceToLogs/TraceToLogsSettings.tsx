import { css } from '@emotion/css';
import React, { useCallback, useMemo } from 'react';

import { DataSourceJsonData, DataSourceInstanceSettings, DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { ConfigSection } from '@grafana/experimental';
import { InlineField, InlineFieldRow, Input, InlineSwitch } from '@grafana/ui';
import { ConfigDescriptionLink } from 'app/core/components/ConfigDescriptionLink';
import { DataSourcePicker } from 'app/features/datasources/components/picker/DataSourcePicker';

import { IntervalInput } from '../IntervalInput/IntervalInput';

import { TagMappingInput } from './TagMappingInput';

export interface TraceToLogsTag {
  key: string;
  value?: string;
}

// @deprecated use getTraceToLogsOptions to get the v2 version of this config from jsonData
export interface TraceToLogsOptions {
  datasourceUid?: string;
  tags?: string[];
  mappedTags?: TraceToLogsTag[];
  mapTagNamesEnabled?: boolean;
  spanStartTimeShift?: string;
  spanEndTimeShift?: string;
  filterByTraceID?: boolean;
  filterBySpanID?: boolean;
  lokiSearch?: boolean; // legacy
}

export interface TraceToLogsOptionsV2 {
  datasourceUid?: string;
  tags?: TraceToLogsTag[];
  spanStartTimeShift?: string;
  spanEndTimeShift?: string;
  filterByTraceID?: boolean;
  filterBySpanID?: boolean;
  query?: string;
  customQuery: boolean;
}

export interface TraceToLogsData extends DataSourceJsonData {
  tracesToLogs?: TraceToLogsOptions;
  tracesToLogsV2?: TraceToLogsOptionsV2;
}

/**
 * Gets new version of the traceToLogs config from the json data either returning directly or transforming the old
 * version to new and returning that.
 */
export function getTraceToLogsOptions(data?: TraceToLogsData): TraceToLogsOptionsV2 | undefined {
  if (data?.tracesToLogsV2) {
    return data.tracesToLogsV2;
  }
  if (!data?.tracesToLogs) {
    return undefined;
  }
  const traceToLogs: TraceToLogsOptionsV2 = {
    customQuery: false,
  };
  traceToLogs.datasourceUid = data.tracesToLogs.datasourceUid;
  traceToLogs.tags = data.tracesToLogs.mapTagNamesEnabled
    ? data.tracesToLogs.mappedTags
    : data.tracesToLogs.tags?.map((tag) => ({ key: tag }));
  traceToLogs.filterByTraceID = data.tracesToLogs.filterByTraceID;
  traceToLogs.filterBySpanID = data.tracesToLogs.filterBySpanID;
  traceToLogs.spanStartTimeShift = data.tracesToLogs.spanStartTimeShift;
  traceToLogs.spanEndTimeShift = data.tracesToLogs.spanEndTimeShift;
  return traceToLogs;
}

interface Props extends DataSourcePluginOptionsEditorProps<TraceToLogsData> {}

export function TraceToLogsSettings({ options, onOptionsChange }: Props) {
  const supportedDataSourceTypes = [
    'loki',
    'elasticsearch',
    'grafana-splunk-datasource', // external
    'grafana-opensearch-datasource', // external
    'grafana-falconlogscale-datasource', // external
    'googlecloud-logging-datasource', // external
  ];

  const traceToLogs = useMemo(
    (): TraceToLogsOptionsV2 => getTraceToLogsOptions(options.jsonData) || { customQuery: false },
    [options.jsonData]
  );
  const { query = '', tags, customQuery } = traceToLogs;

  const updateTracesToLogs = useCallback(
    (value: Partial<TraceToLogsOptionsV2>) => {
      // Cannot use updateDatasourcePluginJsonDataOption here as we need to update 2 keys, and they would overwrite each
      // other as updateDatasourcePluginJsonDataOption isn't synchronized
      onOptionsChange({
        ...options,
        jsonData: {
          ...options.jsonData,
          tracesToLogsV2: {
            ...traceToLogs,
            ...value,
          },
          tracesToLogs: undefined,
        },
      });
    },
    [onOptionsChange, options, traceToLogs]
  );

  return (
    <div className={css({ width: '100%' })}>
      <InlineFieldRow>
        <InlineField
          tooltip="跟踪将导航到的日志数据源"
          label="数据源"
          labelWidth={26}
        >
          <DataSourcePicker
            inputId="trace-to-logs-data-source-picker"
            filter={(ds) => supportedDataSourceTypes.includes(ds.type)}
            current={traceToLogs.datasourceUid}
            noDefault={true}
            width={40}
            onChange={(ds: DataSourceInstanceSettings) =>
              updateTracesToLogs({
                datasourceUid: ds.uid,
              })
            }
          />
        </InlineField>
      </InlineFieldRow>

      <InlineFieldRow>
        <IntervalInput
          label={getTimeShiftLabel('start')}
          tooltip={getTimeShiftTooltip('start', '0')}
          value={traceToLogs.spanStartTimeShift || ''}
          onChange={(val) => {
            updateTracesToLogs({ spanStartTimeShift: val });
          }}
          isInvalidError={invalidTimeShiftError}
        />
      </InlineFieldRow>

      <InlineFieldRow>
        <IntervalInput
          label={getTimeShiftLabel('end')}
          tooltip={getTimeShiftTooltip('end', '0')}
          value={traceToLogs.spanEndTimeShift || ''}
          onChange={(val) => {
            updateTracesToLogs({ spanEndTimeShift: val });
          }}
          isInvalidError={invalidTimeShiftError}
        />
      </InlineFieldRow>

      <InlineFieldRow>
        <InlineField
          tooltip="将在查询中使用的标记。默认标记： “集群”， “主机名”， “命名空间”， “pod”， “service.name”， “服务.命名空间”， “部署.环境”"
          label="标签"
          labelWidth={26}
        >
          <TagMappingInput values={tags ?? []} onChange={(v) => updateTracesToLogs({ tags: v })} />
        </InlineField>
      </InlineFieldRow>

      <IdFilter
        disabled={customQuery}
        type={'trace'}
        id={'filterByTraceID'}
        value={Boolean(traceToLogs.filterByTraceID)}
        onChange={(val) => updateTracesToLogs({ filterByTraceID: val })}
      />
      <IdFilter
        disabled={customQuery}
        type={'span'}
        id={'filterBySpanID'}
        value={Boolean(traceToLogs.filterBySpanID)}
        onChange={(val) => updateTracesToLogs({ filterBySpanID: val })}
      />

      <InlineFieldRow>
        <InlineField
          tooltip="使用自定义查询，可以从跟踪或范围插值变量"
          label="使用自定义查询"
          labelWidth={26}
        >
          <InlineSwitch
            id={'customQuerySwitch'}
            value={customQuery}
            onChange={(event: React.SyntheticEvent<HTMLInputElement>) =>
              updateTracesToLogs({ customQuery: event.currentTarget.checked })
            }
          />
        </InlineField>
      </InlineFieldRow>

      {customQuery && (
        <InlineField
          label="Query"
          labelWidth={26}
          tooltip="从跟踪导航到日志数据源时将运行的查询。使用“$__tags”关键字插值标签"
          grow
        >
          <Input
            label="查询"
            type="text"
            allowFullScreen
            value={query}
            onChange={(e) => updateTracesToLogs({ query: e.currentTarget.value })}
          />
        </InlineField>
      )}
    </div>
  );
}

interface IdFilterProps {
  type: 'trace' | 'span';
  id: string;
  value: boolean;
  onChange: (val: boolean) => void;
  disabled: boolean;
}
function IdFilter(props: IdFilterProps) {
  return (
    <InlineFieldRow>
      <InlineField
        disabled={props.disabled}
        label={`过滤按 ${props.type}的ID`}
        labelWidth={26}
        grow
        tooltip={`过滤日志通过${props.type} ID`}
      >
        <InlineSwitch
          id={props.id}
          value={props.value}
          onChange={(event: React.SyntheticEvent<HTMLInputElement>) => props.onChange(event.currentTarget.checked)}
        />
      </InlineField>
    </InlineFieldRow>
  );
}

export const getTimeShiftLabel = (type: 'start' | 'end') => {
  return `跨越${type}时间移动`;
};

export const getTimeShiftTooltip = (type: 'start' | 'end', defaultVal: string) => {
  return `Shifts the ${type} time of the span. Default: ${defaultVal} (Time units can be used here, for example: 5s, -1m, 3h)`;
};

export const invalidTimeShiftError = 'Invalid time shift. See tooltip for examples.';

export const TraceToLogsSection = ({ options, onOptionsChange }: DataSourcePluginOptionsEditorProps) => {
  return (
    <ConfigSection
      title="Trace to logs"
      description={
        <ConfigDescriptionLink
          description="Navigate from a trace span to the selected data source's logs."
          suffix={`${options.type}/#trace-to-logs`}
          feature="trace to logs"
        />
      }
      isCollapsible={true}
      isInitiallyOpen={true}
    >
      <TraceToLogsSettings options={options} onOptionsChange={onOptionsChange} />
    </ConfigSection>
  );
};
