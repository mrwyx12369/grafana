import { css } from '@emotion/css';
import React, { useEffect, useState } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { CardContainer, LinkButton, useStyles2 } from '@grafana/ui';
import { AccessControlAction } from 'app/types';

import { contextSrv } from '../../core/services/context_srv';
import { Loader } from '../plugins/admin/components/Loader';

import { getServerStats, ServerStat } from './state/apis';

export const ServerStats = () => {
  const [stats, setStats] = useState<ServerStat | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const styles = useStyles2(getStyles);

  const hasAccessToDataSources = contextSrv.hasAccess(AccessControlAction.DataSourcesRead, contextSrv.isGrafanaAdmin);
  const hasAccessToAdminUsers = contextSrv.hasAccess(AccessControlAction.UsersRead, contextSrv.isGrafanaAdmin);

  useEffect(() => {
    if (contextSrv.hasAccess(AccessControlAction.ActionServerStatsRead, contextSrv.isGrafanaAdmin)) {
      setIsLoading(true);
      getServerStats().then((stats) => {
        setStats(stats);
        setIsLoading(false);
      });
    }
  }, []);

  if (!contextSrv.hasAccess(AccessControlAction.ActionServerStatsRead, contextSrv.isGrafanaAdmin)) {
    return null;
  }

  return (
    <>
      <h2 className={styles.title}>实例统计数据</h2>
      {isLoading ? (
        <div className={styles.loader}>
          <Loader text={'加载实例统计数据...'} />
        </div>
      ) : stats ? (
        <div className={styles.row}>
          <StatCard
            content={[
              { name: '仪表板（已加星标）', value: `${stats.dashboards} (${stats.stars})` },
              { name: '标签', value: stats.tags },
              { name: '播放列表', value: stats.playlists },
              { name: '快照', value: stats.snapshots },
            ]}
            footer={
              <LinkButton href={'/dashboards'} variant={'secondary'}>
                管理仪表板
              </LinkButton>
            }
          />

          <div className={styles.doubleRow}>
            <StatCard
              content={[{ name: '数据源', value: stats.datasources }]}
              footer={
                hasAccessToDataSources && (
                  <LinkButton href={'/datasources'} variant={'secondary'}>
                    管理数据源
                  </LinkButton>
                )
              }
            />
            <StatCard
              content={[{ name: '警报', value: stats.alerts }]}
              footer={
                <LinkButton href={'/alerting/list'} variant={'secondary'}>
                  警报
                </LinkButton>
              }
            />
          </div>
          <StatCard
            content={[
              { name: '组织机构', value: stats.orgs },
              { name: '用户数', value: stats.users },
              { name: '过去30天内的活跃用户数', value: stats.activeUsers },
              { name: '活动会话数', value: stats.activeSessions },
            ]}
            footer={
              hasAccessToAdminUsers && (
                <LinkButton href={'/admin/users'} variant={'secondary'}>
                  管理用户
                </LinkButton>
              )
            }
          />
        </div>
      ) : (
        <p className={styles.notFound}>N未找到统计数据。</p>
      )}
    </>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  return {
    title: css`
      margin-bottom: ${theme.spacing(4)};
    `,
    row: css`
      display: flex;
      justify-content: space-between;
      width: 100%;

      & > div:not(:last-of-type) {
        margin-right: ${theme.spacing(2)};
      }

      & > div {
        width: 33.3%;
      }
    `,
    doubleRow: css`
      display: flex;
      flex-direction: column;

      & > div:first-of-type {
        margin-bottom: ${theme.spacing(2)};
      }
    `,

    loader: css`
      height: 290px;
    `,

    notFound: css`
      font-size: ${theme.typography.h6.fontSize};
      text-align: center;
      height: 290px;
    `,
  };
};

type StatCardProps = {
  content: Array<Record<string, number | string>>;
  footer?: JSX.Element | boolean;
};

const StatCard = ({ content, footer }: StatCardProps) => {
  const styles = useStyles2(getCardStyles);
  return (
    <CardContainer className={styles.container} disableHover>
      <div className={styles.inner}>
        <div className={styles.content}>
          {content.map((item) => {
            return (
              <div key={item.name} className={styles.row}>
                <span>{item.name}</span>
                <span>{item.value}</span>
              </div>
            );
          })}
        </div>
        {footer && <div>{footer}</div>}
      </div>
    </CardContainer>
  );
};

const getCardStyles = (theme: GrafanaTheme2) => {
  return {
    container: css`
      padding: ${theme.spacing(2)};
    `,
    inner: css`
      display: flex;
      flex-direction: column;
      width: 100%;
    `,
    content: css`
      flex: 1 0 auto;
    `,
    row: css`
      display: flex;
      justify-content: space-between;
      width: 100%;
      margin-bottom: ${theme.spacing(2)};
      align-items: center;
    `,
  };
};
