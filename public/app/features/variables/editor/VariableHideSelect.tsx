import React, { PropsWithChildren, useMemo } from 'react';

import { VariableType, VariableHide } from '@grafana/data';
import { Field, RadioButtonGroup } from '@grafana/ui';

interface Props {
  onChange: (option: VariableHide) => void;
  hide: VariableHide;
  type: VariableType;
}

const HIDE_OPTIONS = [
  { label: '标签和值', value: VariableHide.dontHide },
  { label: '值', value: VariableHide.hideLabel },
  { label: '无', value: VariableHide.hideVariable },
];

export function VariableHideSelect({ onChange, hide, type }: PropsWithChildren<Props>) {
  const value = useMemo(() => HIDE_OPTIONS.find((o) => o.value === hide)?.value ?? HIDE_OPTIONS[0].value, [hide]);

  if (type === 'constant') {
    return null;
  }

  return (
    <Field label="在仪表板上显示">
      <RadioButtonGroup options={HIDE_OPTIONS} onChange={onChange} value={value} />
    </Field>
  );
}
