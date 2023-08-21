import React from 'react';

import { Stack } from '@grafana/experimental';
import { Tooltip, Button } from '@grafana/ui';

type VersionsButtonsType = {
  hasMore: boolean;
  canCompare: boolean;
  getVersions: (append: boolean) => void;
  getDiff: () => void;
  isLastPage: boolean;
};
export const VersionsHistoryButtons = ({
  hasMore,
  canCompare,
  getVersions,
  getDiff,
  isLastPage,
}: VersionsButtonsType) => (
  <Stack>
    {hasMore && (
      <Button type="button" onClick={() => getVersions(true)} variant="secondary" disabled={isLastPage}>
      显示更多版本
      </Button>
    )}
    <Tooltip content="选择两个版本开始比较" placement="bottom">
      <Button type="button" disabled={!canCompare} onClick={getDiff} icon="code-branch">
        比较版本
      </Button>
    </Tooltip>
  </Stack>
);
