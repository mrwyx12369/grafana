import { css } from '@emotion/css';
import React, { ReactElement } from 'react';
import { useLocation } from 'react-router-dom';

import { SelectableValue, GrafanaTheme2, PluginType } from '@grafana/data';
import { locationSearchToObject } from '@grafana/runtime';
import { LoadingPlaceholder, Select, RadioButtonGroup, useStyles2, Tooltip, Field } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';
import { GrafanaRouteComponentProps } from 'app/core/navigation/types';
import { getNavModel } from 'app/core/selectors/navModel';
import { ROUTES as CONNECTIONS_ROUTES } from 'app/features/connections/constants';
import { useSelector } from 'app/types';

import { HorizontalGroup } from '../components/HorizontalGroup';
import { PluginList } from '../components/PluginList';
import { SearchField } from '../components/SearchField';
import { Sorters } from '../helpers';
import { useHistory } from '../hooks/useHistory';
import { useGetAll, useIsRemotePluginsAvailable, useDisplayMode } from '../state/hooks';
import { PluginListDisplayMode } from '../types';

export default function Browse({ route }: GrafanaRouteComponentProps): ReactElement | null {
  const location = useLocation();
  const locationSearch = locationSearchToObject(location.search);
  const navModel = useSelector((state) => getNavModel(state.navIndex, 'plugins'));
  const { displayMode, setDisplayMode } = useDisplayMode();
  const styles = useStyles2(getStyles);
  const history = useHistory();
  const remotePluginsAvailable = useIsRemotePluginsAvailable();
  const keyword = locationSearch.q?.toString() || '';
  const filterBy = locationSearch.filterBy?.toString() || 'installed';
  const filterByType = (locationSearch.filterByType as PluginType | 'all') || 'all';
  const sortBy = (locationSearch.sortBy as Sorters) || Sorters.nameAsc;
  const { isLoading, error, plugins } = useGetAll(
    {
      keyword,
      type: filterByType !== 'all' ? filterByType : undefined,
      isInstalled: filterBy === 'installed' ? true : undefined,
      isCore: filterBy === 'installed' ? undefined : false, // We only would like to show core plugins when the user filters to installed plugins
    },
    sortBy
  );
  const filterByOptions = [
    { value: 'all', label: '所有' },
    { value: 'installed', label: '已安装' },
  ];

  const onSortByChange = (value: SelectableValue<string>) => {
    history.push({ query: { sortBy: value.value } });
  };

  const onFilterByChange = (value: string) => {
    history.push({ query: { filterBy: value } });
  };

  const onFilterByTypeChange = (value: SelectableValue<string>) => {
    history.push({ query: { filterByType: value.value } });
  };

  const onSearch = (q: string) => {
    history.push({ query: { filterBy, filterByType, q } });
  };

  // How should we handle errors?
  if (error) {
    console.error(error.message);
    return null;
  }

  const subTitle = (
    <div>
    通过面板插件和应用程序扩展 Grafana 体验。要查找更多数据源，请转到{' '}
      <a className="external-link" href={`${CONNECTIONS_ROUTES.AddNewConnection}?cat=data-source`}>
        连接
      </a>
      .
    </div>
  );

  return (
    <Page navModel={navModel} subTitle={subTitle}>
      <Page.Contents>
        <HorizontalGroup wrap>
          <Field label="搜索">
            <SearchField value={keyword} onSearch={onSearch} />
          </Field>
          <HorizontalGroup wrap className={styles.actionBar}>
            {/* Filter by type */}
            <Field label="类型">
              <Select
                aria-label="Plugin type filter"
                value={filterByType}
                onChange={onFilterByTypeChange}
                width={18}
                options={[
                  { value: 'all', label: '所有' },
                  { value: 'datasource', label: '数据源' },
                  { value: 'panel', label: '面板' },
                  { value: 'app', label: '应用' },
                ]}
              />
            </Field>

            {/* Filter by installed / all */}
            {remotePluginsAvailable ? (
              <Field label="状态">
                <RadioButtonGroup value={filterBy} onChange={onFilterByChange} options={filterByOptions} />
              </Field>
            ) : (
              <Tooltip
                content="此过滤器已被禁用，因为Grafana服务器无法访问grafana.com"
                placement="top"
              >
                <div>
                  <Field label="状态">
                    <RadioButtonGroup
                      disabled={true}
                      value={filterBy}
                      onChange={onFilterByChange}
                      options={filterByOptions}
                    />
                  </Field>
                </div>
              </Tooltip>
            )}

            {/* Sorting */}
            <Field label="排序">
              <Select
                aria-label="Sort Plugins List"
                width={24}
                value={sortBy}
                onChange={onSortByChange}
                options={[
                  { value: 'nameAsc', label: '按名称(升序)' },
                  { value: 'nameDesc', label: '按名称(降序)' },
                  { value: 'updated', label: '按更新日期' },
                  { value: 'published', label: '按更发布日期' },
                  { value: 'downloads', label: '按下载次数' },
                ]}
              />
            </Field>

            {/* Display mode */}
            <Field label="查看数">
              <RadioButtonGroup<PluginListDisplayMode>
                className={styles.displayAs}
                value={displayMode}
                onChange={setDisplayMode}
                options={[
                  {
                    value: PluginListDisplayMode.Grid,
                    icon: 'table',
                    description: '在网格布局中显示插件',
                  },
                  { value: PluginListDisplayMode.List, icon: 'list-ul', description: '在列表中显示插件' },
                ]}
              />
            </Field>
          </HorizontalGroup>
        </HorizontalGroup>
        <div className={styles.listWrap}>
          {isLoading ? (
            <LoadingPlaceholder
              className={css`
                margin-bottom: 0;
              `}
              text="Loading results"
            />
          ) : (
            <PluginList plugins={plugins} displayMode={displayMode} />
          )}
        </div>
      </Page.Contents>
    </Page>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  actionBar: css`
    ${theme.breakpoints.up('xl')} {
      margin-left: auto;
    }
  `,
  listWrap: css`
    margin-top: ${theme.spacing(2)};
  `,
  displayAs: css`
    svg {
      margin-right: 0;
    }
  `,
});
