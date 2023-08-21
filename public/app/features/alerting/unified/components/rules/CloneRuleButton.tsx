import { css } from '@emotion/css';
import React, { useState } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { locationService } from '@grafana/runtime';
import { ConfirmModal, LinkButton, useStyles2 } from '@grafana/ui';
import { RuleIdentifier } from 'app/types/unified-alerting';

import * as ruleId from '../../utils/rule-id';

interface CloneRuleButtonProps {
  ruleIdentifier: RuleIdentifier;
  isProvisioned: boolean;
  text?: string;
  className?: string;
}

export const CloneRuleButton = React.forwardRef<HTMLAnchorElement, CloneRuleButtonProps>(
  ({ text, ruleIdentifier, isProvisioned, className }, ref) => {
    // For provisioned rules an additional confirmation step is required
    // Users have to be aware that the cloned rule will NOT be marked as provisioned
    const [showModal, setShowModal] = useState(false);

    const styles = useStyles2(getStyles);
    const cloneUrl = '/alerting/new?copyFrom=' + ruleId.stringifyIdentifier(ruleIdentifier);

    return (
      <>
        <LinkButton
          title="拷贝"
          className={className}
          size="sm"
          key="clone"
          variant="secondary"
          icon="copy"
          href={isProvisioned ? undefined : cloneUrl}
          onClick={isProvisioned ? () => setShowModal(true) : undefined}
          ref={ref}
        >
          {text}
        </LinkButton>

        <ConfirmModal
          isOpen={showModal}
          title="复制预配的警报规则"
          body={
            <div>
              <p>
               新规则将 <span className={styles.bold}>不被</span> 标记为预置规则.
              </p>
              <p>
              您需要为复制的规则设置新的警报组，因为原始警报组已预配，不能用于在 UI 中创建的规则。
              </p>
            </div>
          }
          confirmText="拷贝"
          onConfirm={() => {
            locationService.push(cloneUrl);
          }}
          onDismiss={() => setShowModal(false)}
        />
      </>
    );
  }
);

CloneRuleButton.displayName = 'CloneRuleButton';

const getStyles = (theme: GrafanaTheme2) => ({
  bold: css`
    font-weight: ${theme.typography.fontWeightBold};
  `,
});
