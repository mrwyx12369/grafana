import { css } from '@emotion/css';
import React, { useEffect } from 'react';

import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { config } from '@grafana/runtime';
import { useStyles2, Select, MultiSelect, FilterInput, Button } from '@grafana/ui';
import {
  createDatasourcesList,
  SortOrder,
  RichHistorySearchFilters,
  RichHistorySettings,
} from 'app/core/utils/richHistory';
import { RichHistoryQuery } from 'app/types/explore';

import { getSortOrderOptions } from './RichHistory';
import RichHistoryCard from './RichHistoryCard';

export interface RichHistoryStarredTabProps {
  queries: RichHistoryQuery[];
  totalQueries: number;
  loading: boolean;
  activeDatasourceInstance: string;
  updateFilters: (filtersToUpdate: Partial<RichHistorySearchFilters>) => void;
  clearRichHistoryResults: () => void;
  loadMoreRichHistory: () => void;
  richHistorySearchFilters?: RichHistorySearchFilters;
  richHistorySettings: RichHistorySettings;
  exploreId: string;
}

const getStyles = (theme: GrafanaTheme2) => {
  return {
    container: css`
      display: flex;
    `,
    containerContent: css`
      width: 100%;
    `,
    selectors: css`
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
    `,
    multiselect: css`
      width: 100%;
      margin-bottom: ${theme.spacing(1)};
    `,
    filterInput: css`
      margin-bottom: ${theme.spacing(1)};
    `,
    sort: css`
      width: 170px;
    `,
    footer: css`
      height: 60px;
      margin-top: ${theme.spacing(3)};
      display: flex;
      justify-content: center;
      font-weight: ${theme.typography.fontWeightLight};
      font-size: ${theme.typography.bodySmall.fontSize};
      a {
        font-weight: ${theme.typography.fontWeightMedium};
        margin-left: ${theme.spacing(0.25)};
      }
    `,
  };
};

export function RichHistoryStarredTab(props: RichHistoryStarredTabProps) {
  const {
    updateFilters,
    clearRichHistoryResults,
    loadMoreRichHistory,
    activeDatasourceInstance,
    richHistorySettings,
    queries,
    totalQueries,
    loading,
    richHistorySearchFilters,
    exploreId,
  } = props;

  const styles = useStyles2(getStyles);

  const listOfDatasources = createDatasourcesList();

  useEffect(() => {
    const datasourceFilters =
      richHistorySettings.activeDatasourceOnly && richHistorySettings.lastUsedDatasourceFilters
        ? richHistorySettings.lastUsedDatasourceFilters
        : [activeDatasourceInstance];
    const filters: RichHistorySearchFilters = {
      search: '',
      sortOrder: SortOrder.Descending,
      datasourceFilters,
      from: 0,
      to: richHistorySettings.retentionPeriod,
      starred: true,
    };
    updateFilters(filters);
    return () => {
      clearRichHistoryResults();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!richHistorySearchFilters) {
    return <span>加载...</span>;
  }

  const sortOrderOptions = getSortOrderOptions();

  return (
    <div className={styles.container}>
      <div className={styles.containerContent}>
        <div className={styles.selectors}>
          {!richHistorySettings.activeDatasourceOnly && (
            <MultiSelect
              className={styles.multiselect}
              options={listOfDatasources.map((ds) => {
                return { value: ds.name, label: ds.name };
              })}
              value={richHistorySearchFilters.datasourceFilters}
              placeholder="筛选数据源的查询"
              aria-label="Filter queries for data sources(s)"
              onChange={(options: SelectableValue[]) => {
                updateFilters({ datasourceFilters: options.map((option) => option.value) });
              }}
            />
          )}
          <div className={styles.filterInput}>
            <FilterInput
              escapeRegex={false}
              placeholder="搜索查询"
              value={richHistorySearchFilters.search}
              onChange={(search: string) => updateFilters({ search })}
            />
          </div>
          <div aria-label="Sort queries" className={styles.sort}>
            <Select
              value={sortOrderOptions.filter((order) => order.value === richHistorySearchFilters.sortOrder)}
              options={sortOrderOptions}
              placeholder="查询排序依据"
              onChange={(e: SelectableValue<SortOrder>) => updateFilters({ sortOrder: e.value })}
            />
          </div>
        </div>
        {loading && <span>加载结果...</span>}
        {!loading &&
          queries.map((q) => {
            return <RichHistoryCard query={q} key={q.id} exploreId={exploreId} />;
          })}
        {queries.length && queries.length !== totalQueries ? (
          <div>
            显示{queries.length} / {totalQueries} <Button onClick={loadMoreRichHistory}>加载更多</Button>
          </div>
        ) : null}
        <div className={styles.footer}>
          {!config.queryHistoryEnabled ? '历史记录是浏览器的本地历史记录，不会与他人共享。' : ''}
        </div>
      </div>
    </div>
  );
}
