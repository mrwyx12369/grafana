import React, { useEffect } from 'react';

import { Alert, LoadingPlaceholder } from '@grafana/ui';
import { useCleanup } from 'app/core/hooks/useCleanup';
import { useDispatch } from 'app/types';
import { RuleIdentifier } from 'app/types/unified-alerting';

import { AlertWarning } from './AlertWarning';
import { AlertRuleForm } from './components/rule-editor/AlertRuleForm';
import { useIsRuleEditable } from './hooks/useIsRuleEditable';
import { useUnifiedAlertingSelector } from './hooks/useUnifiedAlertingSelector';
import { fetchEditableRuleAction } from './state/actions';
import { initialAsyncRequestState } from './utils/redux';
import * as ruleId from './utils/rule-id';

interface ExistingRuleEditorProps {
  identifier: RuleIdentifier;
  id?: string;
}

export function ExistingRuleEditor({ identifier, id }: ExistingRuleEditorProps) {
  useCleanup((state) => (state.unifiedAlerting.ruleForm.existingRule = initialAsyncRequestState));

  const {
    loading: loadingAlertRule,
    result,
    error,
    dispatched,
  } = useUnifiedAlertingSelector((state) => state.ruleForm.existingRule);

  const dispatch = useDispatch();
  const { isEditable, loading: loadingEditable } = useIsRuleEditable(
    ruleId.ruleIdentifierToRuleSourceName(identifier),
    result?.rule
  );

  const loading = loadingAlertRule || loadingEditable;

  useEffect(() => {
    if (!dispatched) {
      dispatch(fetchEditableRuleAction(identifier));
    }
  }, [dispatched, dispatch, identifier]);

  if (loading || isEditable === undefined) {
    return <LoadingPlaceholder text="加载规则..." />;
  }

  if (error) {
    return (
      <Alert severity="error" title="无法加载规则">
        {error.message}
      </Alert>
    );
  }

  if (!result) {
    return <AlertWarning title="未找到规则">不好意思！此规则不存在。</AlertWarning>;
  }

  if (isEditable === false) {
    return <AlertWarning title="无法编辑规则">不好意思！您没有编辑此规则的权限。</AlertWarning>;
  }

  return <AlertRuleForm existing={result} />;
}
