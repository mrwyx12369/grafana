// Copyright (c) 2017 Uber Technologies, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { css } from '@emotion/css';
import React from 'react';

import { IconButton, useStyles2 } from '@grafana/ui';

const getStyles = () => {
  return {
    TimelineCollapser: css`
      align-items: center;
      display: flex;
      flex: none;
      justify-content: center;
      margin-right: 0.5rem;
    `,
  };
};

type CollapserProps = {
  onCollapseAll: () => void;
  onCollapseOne: () => void;
  onExpandOne: () => void;
  onExpandAll: () => void;
};

export function TimelineCollapser(props: CollapserProps) {
  const { onExpandAll, onExpandOne, onCollapseAll, onCollapseOne } = props;
  const styles = useStyles2(getStyles);
  return (
    <div className={styles.TimelineCollapser} data-testid="TimelineCollapser">
      <IconButton tooltip="打开 +1" size="xl" tooltipPlacement="top" name="angle-down" onClick={onExpandOne} />
      <IconButton tooltip="关闭 +1" size="xl" tooltipPlacement="top" name="angle-right" onClick={onCollapseOne} />
      <IconButton
        tooltip="全部打开"
        size="xl"
        tooltipPlacement="top"
        name="angle-double-down"
        onClick={onExpandAll}
      />
      <IconButton
        tooltip="全部关闭"
        size="xl"
        tooltipPlacement="top"
        name="angle-double-right"
        onClick={onCollapseAll}
      />
    </div>
  );
}
