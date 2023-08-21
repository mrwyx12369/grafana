import React, { useMemo } from 'react';

import { SelectableValue } from '@grafana/data';
import { EditorField, EditorFieldGroup } from '@grafana/experimental';
import { MultiSelect } from '@grafana/ui';

import { SYSTEM_LABELS } from '../constants';
import { labelsToGroupedOptions } from '../functions';
import { TimeSeriesList } from '../types/query';
import { MetricDescriptor } from '../types/types';

import { Aggregation } from './Aggregation';

export interface Props {
  refId: string;
  variableOptionGroup: SelectableValue<string>;
  labels: string[];
  metricDescriptor?: MetricDescriptor;
  onChange: (query: TimeSeriesList) => void;
  query: TimeSeriesList;
}

export const GroupBy = ({
  refId,
  labels: groupBys = [],
  query,
  onChange,
  variableOptionGroup,
  metricDescriptor,
}: Props) => {
  const options = useMemo(
    () => [variableOptionGroup, ...labelsToGroupedOptions([...groupBys, ...SYSTEM_LABELS])],
    [groupBys, variableOptionGroup]
  );

  return (
    <EditorFieldGroup>
      <EditorField
        label="分组依据"
        tooltip="您可以通过组合不同的时间序列来减少为指标返回的数据量。若要合并多个时间序列，可以指定分组和函数。分组是在标签的基础上完成的。分组函数用于将组中的时间序列合并为单个时间序列。"
      >
        <MultiSelect
          inputId={`${refId}-group-by`}
          width="auto"
          placeholder="选择标签"
          options={options}
          value={query.groupBys ?? []}
          onChange={(options) => {
            onChange({ ...query, groupBys: options.map((o) => o.value!) });
          }}
          menuPlacement="top"
        />
      </EditorField>
      <Aggregation
        metricDescriptor={metricDescriptor}
        templateVariableOptions={variableOptionGroup.options}
        crossSeriesReducer={query.crossSeriesReducer}
        groupBys={query.groupBys ?? []}
        onChange={(crossSeriesReducer) => onChange({ ...query, crossSeriesReducer })}
        refId={refId}
      />
    </EditorFieldGroup>
  );
};
