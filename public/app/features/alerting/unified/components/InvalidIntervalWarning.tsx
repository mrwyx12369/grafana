import React from 'react';

import { config } from '@grafana/runtime';
import { Alert } from '@grafana/ui';

const EvaluationIntervalLimitExceeded = () => (
  <Alert severity="warning" title="超出全局评估间隔限制">
    <strong>{config.unifiedAlerting.minInterval}</strong>的最小评估间隔已在系统中配置。.
    <br />
    请联系管理员以配置较低的间隔。
  </Alert>
);

export { EvaluationIntervalLimitExceeded };
