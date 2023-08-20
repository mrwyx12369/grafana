import { css, cx } from '@emotion/css';
import React from 'react';
import { useFormContext } from 'react-hook-form';

import { GrafanaTheme2 } from '@grafana/data';
import { Field, FieldSet, Input, TextArea, useStyles2 } from '@grafana/ui';

import { useCorrelationsFormContext } from './correlationsFormContext';
import { FormDTO } from './types';
import { getInputId } from './utils';

const getStyles = (theme: GrafanaTheme2) => ({
  label: css`
    max-width: ${theme.spacing(80)};
  `,
  description: css`
    max-width: ${theme.spacing(80)};
  `,
});

export const ConfigureCorrelationBasicInfoForm = () => {
  const { register, formState } = useFormContext<FormDTO>();
  const styles = useStyles2(getStyles);
  const { correlation, readOnly } = useCorrelationsFormContext();

  return (
    <>
      <FieldSet label="定义相关标签（第1步，共3步）">
        <p>定义将描述相关性的文本。</p>
        <input type="hidden" {...register('config.type')} />
        <Field
          label="标签"
          description="此名称将用作关联的标签。这将显示为按钮文本、菜单项或链接上的悬停文本。"
          className={styles.label}
          invalid={!!formState.errors.label}
          error={formState.errors.label?.message}
        >
          <Input
            id={getInputId('label', correlation)}
            {...register('label', { required: { value: true, message: '此字段为必填字段。' } })}
            readOnly={readOnly}
            placeholder="例如速度跟踪"
          />
        </Field>

        <Field
          label="描述"
          description="可选说明，其中包含有关链接的详细信息"
          // the Field component automatically adds margin to itself, so we are forced to workaround it by overriding  its styles
          className={cx(styles.description)}
        >
          <TextArea id={getInputId('description', correlation)} {...register('description')} readOnly={readOnly} />
        </Field>
      </FieldSet>
    </>
  );
};
