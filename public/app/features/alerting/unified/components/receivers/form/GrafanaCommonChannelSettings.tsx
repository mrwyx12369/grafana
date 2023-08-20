import React from 'react';
import { useFormContext } from 'react-hook-form';

import { Checkbox, Field } from '@grafana/ui';

import { CommonSettingsComponentProps } from '../../../types/receiver-form';

export const GrafanaCommonChannelSettings = ({
  pathPrefix,
  className,
  readOnly = false,
}: CommonSettingsComponentProps) => {
  const { register } = useFormContext();
  return (
    <div className={className}>
      <Field>
        <Checkbox
          {...register(`${pathPrefix}disableResolveMessage`)}
          label="禁用已解决的消息"
          description="禁用警报状态返回 false 时发送的解析消息 [OK]"
          disabled={readOnly}
        />
      </Field>
    </div>
  );
};
