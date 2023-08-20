import React from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';

import { DataSourceInstanceSettings } from '@grafana/data';
import { Field, FieldSet } from '@grafana/ui';
import { DataSourcePicker } from 'app/features/datasources/components/picker/DataSourcePicker';

import { QueryEditorField } from './QueryEditorField';
import { useCorrelationsFormContext } from './correlationsFormContext';

export const ConfigureCorrelationTargetForm = () => {
  const { control, formState } = useFormContext();
  const withDsUID = (fn: Function) => (ds: DataSourceInstanceSettings) => fn(ds.uid);
  const { correlation } = useCorrelationsFormContext();
  const targetUID: string | undefined = useWatch({ name: 'targetUID' }) || correlation?.targetUID;

  return (
    <>
      <FieldSet label="设置关联目标（第2步，共3步）">
        <p>
          定义相关性将链接到的数据源，以及单击相关性时将运行的查询。
        </p>
        <Controller
          control={control}
          name="targetUID"
          rules={{ required: { value: true, message: '此字段为必填字段。' } }}
          render={({ field: { onChange, value } }) => (
            <Field
              label="目标"
              description="指定单击链接时查询的数据源"
              htmlFor="target"
              invalid={!!formState.errors.targetUID}
              error={formState.errors.targetUID?.message}
            >
              <DataSourcePicker
                onChange={withDsUID(onChange)}
                noDefault
                current={value}
                inputId="target"
                width={32}
                disabled={correlation !== undefined}
              />
            </Field>
          )}
        />

        <QueryEditorField
          name="config.target"
          dsUid={targetUID}
          invalid={!!formState.errors?.config?.target}
          error={formState.errors?.config?.target?.message}
        />
      </FieldSet>
    </>
  );
};
