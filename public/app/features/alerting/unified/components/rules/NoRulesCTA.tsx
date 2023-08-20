import React from 'react';

import { logInfo } from '@grafana/runtime';
import { CallToActionCard } from '@grafana/ui';
import EmptyListCTA from 'app/core/components/EmptyListCTA/EmptyListCTA';

import { LogMessages } from '../../Analytics';
import { useRulesAccess } from '../../utils/accessControlHooks';

export const NoRulesSplash = () => {
  const { canCreateGrafanaRules, canCreateCloudRules } = useRulesAccess();

  if (canCreateGrafanaRules || canCreateCloudRules) {
    return (
      <EmptyListCTA
        title="尚未创建任何警报规则"
        buttonIcon="bell"
        buttonLink={'alerting/new/alerting'}
        buttonTitle="新警报规则"
        proTip="还可以从现有面板和查询创建警报规则。"
        proTipLink="https://www.smxyi.com/datav/docs/"
        proTipLinkTitle="详情"
        proTipTarget="_blank"
        onClick={() => logInfo(LogMessages.alertRuleFromScratch)}
      />
    );
  }
  return <CallToActionCard message="尚不存在任何规则。" callToActionElement={<div />} />;
};
