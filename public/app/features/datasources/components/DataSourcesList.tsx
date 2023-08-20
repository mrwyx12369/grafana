import { css } from '@emotion/css';
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { DataSourceSettings, GrafanaTheme2 } from '@grafana/data';
import { config } from '@grafana/runtime';
import { LinkButton, Card, Tag, useStyles2 } from '@grafana/ui';
import EmptyListCTA from 'app/core/components/EmptyListCTA/EmptyListCTA';
import PageLoader from 'app/core/components/PageLoader/PageLoader';
import { contextSrv } from 'app/core/core';
import { StoreState, AccessControlAction, useSelector } from 'app/types';

import { getDataSources, getDataSourcesCount, useDataSourcesRoutes, useLoadDataSources } from '../state';
import { trackCreateDashboardClicked, trackExploreClicked, trackDataSourcesListViewed } from '../tracking';
import { constructDataSourceExploreUrl } from '../utils';

import { DataSourcesListHeader } from './DataSourcesListHeader';

export function DataSourcesList() {
  const { isLoading } = useLoadDataSources();

  const dataSources = useSelector((state) => getDataSources(state.dataSources));
  const dataSourcesCount = useSelector(({ dataSources }: StoreState) => getDataSourcesCount(dataSources));
  const hasCreateRights = contextSrv.hasPermission(AccessControlAction.DataSourcesCreate);
  const hasWriteRights = contextSrv.hasPermission(AccessControlAction.DataSourcesWrite);
  const hasExploreRights = contextSrv.hasPermission(AccessControlAction.DataSourcesExplore);

  return (
    <DataSourcesListView
      dataSources={dataSources}
      dataSourcesCount={dataSourcesCount}
      isLoading={isLoading}
      hasCreateRights={hasCreateRights}
      hasWriteRights={hasWriteRights}
      hasExploreRights={hasExploreRights}
    />
  );
}

export type ViewProps = {
  dataSources: DataSourceSettings[];
  dataSourcesCount: number;
  isLoading: boolean;
  hasCreateRights: boolean;
  hasWriteRights: boolean;
  hasExploreRights: boolean;
};

export function DataSourcesListView({
  dataSources,
  dataSourcesCount,
  isLoading,
  hasCreateRights,
  hasWriteRights,
  hasExploreRights,
}: ViewProps) {
  const styles = useStyles2(getStyles);
  const dataSourcesRoutes = useDataSourcesRoutes();
  const location = useLocation();

  useEffect(() => {
    trackDataSourcesListViewed({
      grafana_version: config.buildInfo.version,
      path: location.pathname,
    });
  }, [location]);

  if (isLoading) {
    return <PageLoader />;
  }

  if (dataSourcesCount === 0) {
    return (
      <EmptyListCTA
        buttonDisabled={!hasCreateRights}
        title="未定义数据源"
        buttonIcon="database"
        buttonLink={dataSourcesRoutes.New}
        buttonTitle="添加数据源"
        proTip="您还可以通过配置文件定义数据源。"
        proTipLink="#"
        proTipLinkTitle="了解更多信息"
        proTipTarget="_blank"
      />
    );
  }

  return (
    <>
      {/* List Header */}
      <DataSourcesListHeader />

      {/* List */}
      <ul className={styles.list}>
        {dataSources.map((dataSource) => {
          const dsLink = config.appSubUrl + dataSourcesRoutes.Edit.replace(/:uid/gi, dataSource.uid);
          return (
            <li key={dataSource.uid}>
              <Card href={hasWriteRights ? dsLink : undefined}>
                <Card.Heading>{dataSource.name}</Card.Heading>
                <Card.Figure>
                  <img src={dataSource.typeLogoUrl} alt="" height="40px" width="40px" className={styles.logo} />
                </Card.Figure>
                <Card.Meta>
                  {[
                    dataSource.typeName,
                    dataSource.url,
                    dataSource.isDefault && <Tag key="default-tag" name={'default'} colorIndex={1} />,
                  ]}
                </Card.Meta>
                <Card.Tags>
                  {/* Build Dashboard */}
                  <LinkButton
                    icon="apps"
                    fill="outline"
                    variant="secondary"
                    href={`dashboard/new-with-ds/${dataSource.uid}`}
                    onClick={() => {
                      trackCreateDashboardClicked({
                        grafana_version: config.buildInfo.version,
                        datasource_uid: dataSource.uid,
                        plugin_name: dataSource.typeName,
                        path: location.pathname,
                      });
                    }}
                  >
                    构建仪表板
                  </LinkButton>

                  {/* Explore */}
                  {hasExploreRights && (
                    <LinkButton
                      icon="compass"
                      fill="outline"
                      variant="secondary"
                      className={styles.button}
                      href={constructDataSourceExploreUrl(dataSource)}
                      onClick={() => {
                        trackExploreClicked({
                          grafana_version: config.buildInfo.version,
                          datasource_uid: dataSource.uid,
                          plugin_name: dataSource.typeName,
                          path: location.pathname,
                        });
                      }}
                    >
                      探索数据
                    </LinkButton>
                  )}
                </Card.Tags>
              </Card>
            </li>
          );
        })}
      </ul>
    </>
  );
}

const getStyles = (theme: GrafanaTheme2) => {
  return {
    list: css({
      listStyle: 'none',
      display: 'grid',
      // gap: '8px', Add back when legacy support for old Card interface is dropped
    }),
    logo: css({
      objectFit: 'contain',
    }),
    button: css({
      marginLeft: theme.spacing(2),
    }),
  };
};
