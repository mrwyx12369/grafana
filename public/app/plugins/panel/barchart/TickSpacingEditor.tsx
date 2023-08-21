import React from 'react';

import { SelectableValue, StandardEditorProps } from '@grafana/data';
import { Checkbox, HorizontalGroup, RadioButtonGroup, Tooltip } from '@grafana/ui';

const GAPS_OPTIONS: Array<SelectableValue<number>> = [
  {
    label: '无',
    value: 0,
    description: '显示所有刻度线',
  },
  {
    label: '小',
    value: 100,
    description: '需要100px间距',
  },
  {
    label: '中',
    value: 200,
    description: '需要200px间距',
  },
  {
    label: '大',
    value: 300,
    description: '需要300px间距',
  },
];

export const TickSpacingEditor = (props: StandardEditorProps<number>) => {
  let value = props.value ?? 0;
  const isRTL = value < 0;
  if (isRTL) {
    value *= -1;
  }
  let gap = GAPS_OPTIONS[0];
  for (const v of GAPS_OPTIONS) {
    gap = v;
    if (value <= gap.value!) {
      break;
    }
  }

  const onSpacingChange = (val: number) => {
    props.onChange(val * (isRTL ? -1 : 1));
  };

  const onRTLChange = () => {
    props.onChange(props.value * -1);
  };

  return (
    <HorizontalGroup>
      <RadioButtonGroup value={gap.value} options={GAPS_OPTIONS} onChange={onSpacingChange} />
      {value !== 0 && (
        <Tooltip content="需要右侧的空间" placement="top">
          <div>
            <Checkbox value={isRTL} onChange={onRTLChange} label="RTL" />
          </div>
        </Tooltip>
      )}
    </HorizontalGroup>
  );
};
