import { css } from '@emotion/css';
import React, { useEffect, useCallback } from 'react';

import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { config } from '@grafana/runtime';
import { Button, FilterInput, MultiSelect, RangeSlider, Select, useStyles2 } from '@grafana/ui';
import {
  createDatasourcesList,
  mapNumbertoTimeInSlider,
  mapQueriesToHeadings,
  SortOrder,
  RichHistorySearchFilters,
  RichHistorySettings,
} from 'app/core/utils/richHistory';
import { RichHistoryQuery } from 'app/types/explore';

import { getSortOrderOptions } from './RichHistory';
import RichHistoryCard from './RichHistoryCard';

export interface RichHistoryQueriesTabProps {
  queries: RichHistoryQuery[];
  totalQueries: number;
  loading: boolean;
  activeDatasourceInstance: string;
  updateFilters: (filtersToUpdate?: Partial<RichHistorySearchFilters>) => void;
  clearRichHistoryResults: () => void;
  loadMoreRichHistory: () => void;
  richHistorySettings: RichHistorySettings;
  richHistorySearchFilters?: RichHistorySearchFilters;
  exploreId: string;
  height: number;
}

const getStyles = (theme: GrafanaTheme2, height: number) => {
  return {
    container: css`
      display: flex;
    `,
    labelSlider: css`
      font-size: ${theme.typography.bodySmall.fontSize};
      &:last-of-type {
        margin-top: ${theme.spacing(3)};
      }
      &:first-of-type {
        font-weight: ${theme.typography.fontWeightMedium};
        margin-bottom: ${theme.spacing(2)};
      }
    `,
    containerContent: css`
      /* 134px is based on the width of the Query history tabs bar, so the content is aligned to right side of the tab */
      width: calc(100% - 134px);
    `,
    containerSlider: css`
      width: 129px;
      margin-right: ${theme.spacing(1)};
    `,
    fixedSlider: css`
      position: fixed;
    `,
    slider: css`
      bottom: 10px;
      height: ${height - 180}px;
      width: 129px;
      padding: ${theme.spacing(1)} 0;
    `,
    selectors: css`
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
    `,
    filterInput: css`
      margin-bottom: ${theme.spacing(1)};
    `,
    multiselect: css`
      width: 100%;
      margin-bottom: ${theme.spacing(1)};
    `,
    sort: css`
      width: 170px;
    `,
    sessionName: css`
      display: flex;
      align-items: flex-start;
      justify-content: flex-start;
      margin-top: ${theme.spacing(3)};
      h4 {
        margin: 0 10px 0 0;
      }
    `,
    heading: css`
      font-size: ${theme.typography.h4.fontSize};
      margin: ${theme.spacing(2, 0.25, 1, 0.25)};
    `,
    footer: css`
      height: 60px;
      margin: ${theme.spacing(3)} auto;
      display: flex;
      justify-content: center;
      font-weight: ${theme.typography.fontWeightLight};
      font-size: ${theme.typography.bodySmall.fontSize};
      a {
        font-weight: ${theme.typography.fontWeightMedium};
        margin-left: ${theme.spacing(0.25)};
      }
    `,
    queries: css`
      font-size: ${theme.typography.bodySmall.fontSize};
      font-weight: ${theme.typography.fontWeightRegular};
      margin-left: ${theme.spacing(0.5)};
    `,
  };
};

export function RichHistoryQueriesTab(props: RichHistoryQueriesTabProps) {
  const {
    queries,
    totalQueries,
    loading,
    richHistorySearchFilters,
    updateFilters,
    clearRichHistoryResults,
    loadMoreRichHistory,
    richHistorySettings,
    exploreId,
    height,
    activeDatasourceInstance,
  } = props;

  const styles = useStyles2(useCallback((theme: GrafanaTheme2) => getStyles(theme, height), [height]));

  const listOfDatasources = createDatasourcesList();

  useEffect(() => {
    const datasourceFilters =
      !richHistorySettings.activeDatasourceOnly && richHistorySettings.lastUsedDatasourceFilters
        ? richHistorySettings.lastUsedDatasourceFilters
        : [activeDatasourceInstance];
    const filters: RichHistorySearchFilters = {
      search: '',
      sortOrder: SortOrder.Descending,
      datasourceFilters,
      from: 0,
      to: richHistorySettings.retentionPeriod,
      starred: false,
    };
    updateFilters(filters);

    return () => {
      clearRichHistoryResults();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!richHistorySearchFilters) {
    return <span>Loading...</span>;
  }

  /* mappedQueriesToHeadings is an object where query headings (stringified dates/data sources)
   * are keys and arrays with queries that belong to that headings are values.
   */
  const mappedQueriesToHeadings = mapQueriesToHeadings(queries, richHistorySearchFilters.sortOrder);
  const sortOrderOptions = getSortOrderOptions();
  const partialResults = queries.length && queries.length !== totalQueries;

  return (
    <div className={styles.container}>
      <div className={styles.containerSlider}>
        <div className={styles.fixedSlider}>
          <div className={styles.labelSlider}>筛选历史记录</div>
          <div className={styles.labelSlider}>{mapNumbertoTimeInSlider(richHistorySearchFilters.from)}</div>
          <div className={styles.slider}>
            <RangeSlider
              tooltipAlwaysVisible={false}
              min={0}
              max={richHistorySettings.retentionPeriod}
              value={[richHistorySearchFilters.from, richHistorySearchFilters.to]}
              orientation="vertical"
              formatTooltipResult={mapNumbertoTimeInSlider}
              reverse={true}
              onAfterChange={(value) => {
                updateFilters({ from: value![0], to: value![1] });
              }}
            />
          </div>
          <div className={styles.labelSlider}>{mapNumbertoTimeInSlider(richHistorySearchFilters.to)}</div>
        </div>
      </div>

      <div className={styles.containerContent} data-testid="query-history-queries-tab">
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
          Object.keys(mappedQueriesToHeadings).map((heading) => {
            return (
              <div key={heading}>
                <div className={styles.heading}>
                  {heading}{' '}
                  <span className={styles.queries}>
                    {partialResults ? '显示 ' : ''}
                    {mappedQueriesToHeadings[heading].length} 个查询
                  </span>
                </div>
                {mappedQueriesToHeadings[heading].map((q) => {
                  return <RichHistoryCard query={q} key={q.id} exploreId={exploreId} />;
                })}
              </div>
            );
          })}
        {partialResults ? (
          <div>
            Showing {queries.length} of {totalQueries} <Button onClick={loadMoreRichHistory}>加载更多</Button>
          </div>
        ) : null}
        <div className={styles.footer}>
          {!config.queryHistoryEnabled ? '历史记录是浏览器的本地历史记录，不会与他人共享。' : ''}
        </div>
      </div>
    </div>
  );
}
