import { css } from '@emotion/css';
import React from 'react';

import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { RadioButtonGroup, Label, useStyles2 } from '@grafana/ui';
import { AlertState } from 'app/plugins/datasource/alertmanager/types';

interface Props {
  stateFilter?: AlertState;
  onStateFilterChange: (value: AlertState) => void;
}

export const AlertStateFilter = ({ onStateFilterChange, stateFilter }: Props) => {
  const styles = useStyles2(getStyles);
  const alertStateOptions: SelectableValue[] = Object.entries(AlertState)
    .sort(([labelA], [labelB]) => (labelA < labelB ? -1 : 1))
    .map(([label, state]) => ({
      label: label.valueOf() === 'Unprocessed' ? '未处理' : (label.valueOf() === 'Active' ?'活动中':'已抑制'),
      value: state,
    }));

  return (
    <div className= { styles.wrapper } >
    <Label>状态</Label>
    < RadioButtonGroup options = { alertStateOptions } value = { stateFilter } onChange = { onStateFilterChange } />
      </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  wrapper: css`
    margin-left: ${theme.spacing(1)};
  `,
});
