import { css } from '@emotion/css';
import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { DataSourceInstanceSettings, GrafanaTheme2 } from '@grafana/data';
import { Card, Field, FieldSet, Input, useStyles2 } from '@grafana/ui';
import { DataSourcePicker } from 'app/features/datasources/components/picker/DataSourcePicker';
import { getDatasourceSrv } from 'app/features/plugins/datasource_srv';

import { getVariableUsageInfo } from '../../explore/utils/links';

import { TransformationsEditor } from './TransformationsEditor';
import { useCorrelationsFormContext } from './correlationsFormContext';
import { getInputId } from './utils';

const getStyles = (theme: GrafanaTheme2) => ({
  label: css`
    max-width: ${theme.spacing(80)};
  `,
  variable: css`
    font-family: ${theme.typography.fontFamilyMonospace};
    font-weight: ${theme.typography.fontWeightMedium};
  `,
});

export const ConfigureCorrelationSourceForm = () => {
  const { control, formState, register, getValues } = useFormContext();
  const styles = useStyles2(getStyles);
  const withDsUID = (fn: Function) => (ds: DataSourceInstanceSettings) => fn(ds.uid);

  const { correlation, readOnly } = useCorrelationsFormContext();

  const currentTargetQuery = getValues('config.target');
  const variables = getVariableUsageInfo(currentTargetQuery, {}).variables.map(
    (variable) => variable.variableName + (variable.fieldPath ? `.${variable.fieldPath}` : '')
  );
  return (
    <>
      <FieldSet
        label={`配置将链接到的数据源 ${getDatasourceSrv().getInstanceSettings(
          correlation?.targetUID
        )?.name} (第3步，共3步`}
      >
        <p>
          定义哪些数据源将显示相关性，哪些数据将替换以前定义的变量。
        </p>
        <Controller
          control={control}
          name="sourceUID"
          rules={{
            required: { value: true, message: '此字段为必填字段。' },
            validate: {
              writable: (uid: string) =>
                !getDatasourceSrv().getInstanceSettings(uid)?.readOnly || "源不能是只读数据源。",
            },
          }}
          render={({ field: { onChange, value } }) => (
            <Field
              label="数据源"
              description="来自所选源数据源的结果在面板中显示链接"
              htmlFor="source"
              invalid={!!formState.errors.sourceUID}
              error={formState.errors.sourceUID?.message}
            >
              <DataSourcePicker
                onChange={withDsUID(onChange)}
                noDefault
                current={value}
                inputId="source"
                width={32}
                disabled={correlation !== undefined}
              />
            </Field>
          )}
        />

        <Field
          label="结果字段"
          description="该链接将显示在此字段的值旁边d"
          className={styles.label}
          invalid={!!formState.errors?.config?.field}
          error={formState.errors?.config?.field?.message}
        >
          <Input
            id={getInputId('field', correlation)}
            {...register('config.field', { required: '此字段为必填字段。' })}
            readOnly={readOnly}
          />
        </Field>
        {variables.length > 0 && (
          <Card>
            <Card.Heading>目标查询中使用的变量</Card.Heading>
            <Card.Description>
              您已在目标查询中使用以下变量:{' '}
              {variables.map((name, i) => (
                <span className={styles.variable} key={i}>
                  {name}
                  {i < variables.length - 1 ? ', ' : ''}
                </span>
              ))}
              <br />数据点需要为所有变量提供值作为字段或转换输出进行关联按钮将显示在可视化效果中。
              <br />
                注意：并非每个变量都需要在下面明确定义。诸如{' '}
              <span className={styles.variable}>logfmt</span> 将为每个键值对创建变量。.
            </Card.Description>
          </Card>
        )}
        <TransformationsEditor readOnly={readOnly} />
      </FieldSet>
    </>
  );
};
