import React, { PropsWithChildren, useMemo, useState } from 'react';

import { VariableRefresh } from '@grafana/data';
import { Field, RadioButtonGroup, useTheme2 } from '@grafana/ui';
import { useMediaQueryChange } from 'app/core/hooks/useMediaQueryChange';

interface Props {
  onChange: (option: VariableRefresh) => void;
  refresh: VariableRefresh;
}

const REFRESH_OPTIONS = [
  { label: '加载仪表板时', value: VariableRefresh.onDashboardLoad },
  { label: '时间范围更改', value: VariableRefresh.onTimeRangeChanged },
];

export function QueryVariableRefreshSelect({ onChange, refresh }: PropsWithChildren<Props>) {
  const theme = useTheme2();

  const [isSmallScreen, setIsSmallScreen] = useState(false);
  useMediaQueryChange({
    breakpoint: theme.breakpoints.values.sm,
    onChange: (e) => {
      setIsSmallScreen(!e.matches);
    },
  });

  const value = useMemo(
    () => REFRESH_OPTIONS.find((o) => o.value === refresh)?.value ?? REFRESH_OPTIONS[0].value,
    [refresh]
  );

  return (
    <Field label="刷新" description="何时更新此变量的值">
      <RadioButtonGroup
        options={REFRESH_OPTIONS}
        onChange={onChange}
        value={value}
        size={isSmallScreen ? 'sm' : 'md'}
      />
    </Field>
  );
}
