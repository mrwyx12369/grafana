import { css } from '@emotion/css';
import React from 'react';

import { GrafanaTheme2 } from '@grafana/data/src';
import { Alert, useStyles2 } from '@grafana/ui/src';

import { AlertmanagerChoice } from '../../../../plugins/datasource/alertmanager/types';
import { alertmanagerApi } from '../api/alertmanagerApi';
import { GRAFANA_RULES_SOURCE_NAME } from '../utils/datasource';

interface GrafanaAlertmanagerDeliveryWarningProps {
  currentAlertmanager: string;
}

export function GrafanaAlertmanagerDeliveryWarning({ currentAlertmanager }: GrafanaAlertmanagerDeliveryWarningProps) {
  const styles = useStyles2(getStyles);

  const { useGetAlertmanagerChoiceStatusQuery } = alertmanagerApi;
  const { currentData: amChoiceStatus } = useGetAlertmanagerChoiceStatusQuery();

  const viewingInternalAM = currentAlertmanager === GRAFANA_RULES_SOURCE_NAME;

  const interactsWithExternalAMs =
    amChoiceStatus?.alertmanagersChoice &&
    [AlertmanagerChoice.External, AlertmanagerChoice.All].includes(amChoiceStatus?.alertmanagersChoice);

  if (!interactsWithExternalAMs || !viewingInternalAM) {
    return null;
  }

  const hasActiveExternalAMs = amChoiceStatus.numExternalAlertmanagers > 0;

  if (amChoiceStatus.alertmanagersChoice === AlertmanagerChoice.External) {
    return (
      <Alert title="系统警报不会传递到系统警报管理器">
        系统配置为仅向外部警报管理器发送警报。更改系统警报管理器配置不会影响警报的传递。
        <div className={styles.adminHint}>
        要更改警报管理器设置，请转到警报管理员页面。如果您没有访问权限，请联系您的管理员。
        </div>
      </Alert>
    );
  }

  if (amChoiceStatus.alertmanagersChoice === AlertmanagerChoice.All && hasActiveExternalAMs) {
    return (
      <Alert title="您需要配置其他警报管理器" severity="warning">
         确保在正确的警报管理器中进行配置更改;内部和外部。改变一个不会影响其他人。
        <div className={styles.adminHint}>
          要更改警报管理器设置，请转到警报管理员页面。如果您没有访问权限，请联系您的管理员。
        </div>
      </Alert>
    );
  }

  return null;
}

const getStyles = (theme: GrafanaTheme2) => ({
  adminHint: css`
    font-size: ${theme.typography.bodySmall.fontSize};
    font-weight: ${theme.typography.bodySmall.fontWeight};
  `,
});
