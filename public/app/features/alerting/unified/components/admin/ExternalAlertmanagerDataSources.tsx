import { css } from '@emotion/css';
import { capitalize } from 'lodash';
import React from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { Badge, CallToActionCard, Card, Icon, LinkButton, Tooltip, useStyles2 } from '@grafana/ui';

import { ExternalDataSourceAM } from '../../hooks/useExternalAmSelector';
import { makeDataSourceLink } from '../../utils/misc';

export interface ExternalAlertManagerDataSourcesProps {
  alertmanagers: ExternalDataSourceAM[];
  inactive: boolean;
}

export function ExternalAlertmanagerDataSources({ alertmanagers, inactive }: ExternalAlertManagerDataSourcesProps) {
  const styles = useStyles2(getStyles);

  return (
    <>
      <h5>警报管理器接收系统管理的警报</h5>
      <div className={styles.muted}>
        警报管理器数据源支持一种配置设置，该设置允许您选择发送系统管理的警报管理器。 <br />
        在下面，您可以看到启用了此设置的所有警报管理器数据源的列表。
      </div>
      {alertmanagers.length === 0 && (
        <CallToActionCard
          message={
            <div>
              没有配置为接收系统管理的警报的警报管理器数据源。 <br />
              可以通过在数据源配置中选择“接收系统警报”来更改此设置。
            </div>
          }
          callToActionElement={<LinkButton href="/datasources">转到数据源</LinkButton>}
          className={styles.externalDsCTA}
        />
      )}
      {alertmanagers.length > 0 && (
        <div className={styles.externalDs}>
          {alertmanagers.map((am) => (
            <ExternalAMdataSourceCard key={am.dataSource.uid} alertmanager={am} inactive={inactive} />
          ))}
        </div>
      )}
    </>
  );
}

interface ExternalAMdataSourceCardProps {
  alertmanager: ExternalDataSourceAM;
  inactive: boolean;
}

export function ExternalAMdataSourceCard({ alertmanager, inactive }: ExternalAMdataSourceCardProps) {
  const styles = useStyles2(getStyles);

  const { dataSource, status, statusInconclusive, url } = alertmanager;

  return (
    <Card>
      <Card.Heading className={styles.externalHeading}>
        {dataSource.name}{' '}
        {statusInconclusive && (
          <Tooltip content="多个警报管理器配置了相同的URL。状态可能尚无定论。">
            <Icon name="exclamation-triangle" size="md" className={styles.externalWarningIcon} />
          </Tooltip>
        )}
      </Card.Heading>
      <Card.Figure>
        <img
          src="public/app/plugins/datasource/alertmanager/img/logo.svg"
          alt=""
          height="40px"
          width="40px"
          style={{ objectFit: 'contain' }}
        />
      </Card.Figure>
      <Card.Tags>
        {inactive ? (
          <Badge
            text="非活动"
            color="red"
            tooltip="系统配置为仅向内置的内部警报管理器发送警报。外部警报管理器不会收到任何警报。"
          />
        ) : (
          <Badge
            text={capitalize(status)}
            color={status === 'dropped' ? 'red' : status === 'active' ? 'green' : 'orange'}
          />
        )}
      </Card.Tags>
      <Card.Meta>{url}</Card.Meta>
      <Card.Actions>
        <LinkButton href={makeDataSourceLink(dataSource)} size="sm" variant="secondary">
          Go to datasource
        </LinkButton>
      </Card.Actions>
    </Card>
  );
}

export const getStyles = (theme: GrafanaTheme2) => ({
  muted: css`
    font-size: ${theme.typography.bodySmall.fontSize};
    line-height: ${theme.typography.bodySmall.lineHeight};
    color: ${theme.colors.text.secondary};
  `,
  externalHeading: css`
    justify-content: flex-start;
  `,
  externalWarningIcon: css`
    margin: ${theme.spacing(0, 1)};
    fill: ${theme.colors.warning.main};
  `,
  externalDs: css`
    display: grid;
    gap: ${theme.spacing(1)};
    padding: ${theme.spacing(2, 0)};
  `,
  externalDsCTA: css`
    margin: ${theme.spacing(2, 0)};
  `,
});
