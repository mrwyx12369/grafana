import React, { useCallback, useState } from 'react';

import { Input } from '@grafana/ui';

import { AzureQueryEditorFieldProps } from '../../types';
import { Field } from '../Field';

import { setLegendAlias } from './setQueryValue';

const LegendFormatField = ({ onQueryChange, query }: AzureQueryEditorFieldProps) => {
  const [value, setValue] = useState<string>(query.azureMonitor?.alias ?? '');

  // As calling onQueryChange initiates a the datasource refresh, we only want to call it once
  // the field loses focus
  const handleChange = useCallback((ev: React.FormEvent) => {
    if (ev.target instanceof HTMLInputElement) {
      setValue(ev.target.value);
    }
  }, []);

  const handleBlur = useCallback(() => {
    const newQuery = setLegendAlias(query, value);
    onQueryChange(newQuery);
  }, [onQueryChange, query, value]);

  return (
    <Field label="图例格式">
      <Input
        id="azure-monitor-metrics-legend-field"
        placeholder="别名模式"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        width={38}
      />
    </Field>
  );
};

export default LegendFormatField;
