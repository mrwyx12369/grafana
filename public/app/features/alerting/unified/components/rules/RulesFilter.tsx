import { css } from '@emotion/css';
import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

import { DataSourceInstanceSettings, GrafanaTheme2, SelectableValue } from '@grafana/data';
import { Stack } from '@grafana/experimental';
import { logInfo } from '@grafana/runtime';
import { Button, Field, Icon, Input, Label, RadioButtonGroup, Tooltip, useStyles2 } from '@grafana/ui';
import { useQueryParams } from 'app/core/hooks/useQueryParams';
import { PromAlertingRuleState, PromRuleType } from 'app/types/unified-alerting-dto';

import { LogMessages } from '../../Analytics';
import { useRulesFilter } from '../../hooks/useFilteredRules';
import { RuleHealth } from '../../search/rulesSearchParser';
import { alertStateToReadable } from '../../utils/rules';
import { HoverCard } from '../HoverCard';

import { MultipleDataSourcePicker } from './MultipleDataSourcePicker';

const ViewOptions: SelectableValue[] = [
  {
    icon: 'folder',
    label: '分组',
    value: 'grouped',
  },
  {
    icon: 'list-ul',
    label: '列表',
    value: 'list',
  },
  {
    icon: 'heart-rate',
    label: '状态',
    value: 'state',
  },
];

const RuleTypeOptions: SelectableValue[] = [
  {
    label: '警报 ',
    value: PromRuleType.Alerting,
  },
  {
    label: '记录 ',
    value: PromRuleType.Recording,
  },
];

const RuleHealthOptions: SelectableValue[] = [
  { label: '确定', value: RuleHealth.Ok },
  { label: '无数据', value: RuleHealth.NoData },
  { label: '错误', value: RuleHealth.Error },
];

interface RulesFilerProps {
  onFilterCleared?: () => void;
}

const RuleStateOptions = Object.entries(PromAlertingRuleState).map(([key, value]) => ({
  label: alertStateToReadable(value),
  value,
}));

const RulesFilter = ({ onFilterCleared = () => undefined }: RulesFilerProps) => {
  const styles = useStyles2(getStyles);
  const [queryParams, setQueryParams] = useQueryParams();
  const { filterState, hasActiveFilters, searchQuery, setSearchQuery, updateFilters } = useRulesFilter();

  // This key is used to force a rerender on the inputs when the filters are cleared
  const [filterKey, setFilterKey] = useState<number>(Math.floor(Math.random() * 100));
  const dataSourceKey = `dataSource-${filterKey}`;
  const queryStringKey = `queryString-${filterKey}`;

  const searchQueryRef = useRef<HTMLInputElement | null>(null);
  const { handleSubmit, register, setValue } = useForm<{ searchQuery: string }>({ defaultValues: { searchQuery } });
  const { ref, ...rest } = register('searchQuery');

  useEffect(() => {
    setValue('searchQuery', searchQuery);
  }, [searchQuery, setValue]);

  const handleDataSourceChange = (dataSourceValue: DataSourceInstanceSettings, action: 'add' | 'remove') => {
    const dataSourceNames =
      action === 'add'
        ? [...filterState.dataSourceNames].concat([dataSourceValue.name])
        : filterState.dataSourceNames.filter((name) => name !== dataSourceValue.name);

    updateFilters({
      ...filterState,
      dataSourceNames,
    });

    setFilterKey((key) => key + 1);
  };

  const clearDataSource = () => {
    updateFilters({ ...filterState, dataSourceNames: [] });
    setFilterKey((key) => key + 1);
  };

  const handleAlertStateChange = (value: PromAlertingRuleState) => {
    logInfo(LogMessages.clickingAlertStateFilters);
    updateFilters({ ...filterState, ruleState: value });
    setFilterKey((key) => key + 1);
  };

  const handleViewChange = (view: string) => {
    setQueryParams({ view });
  };

  const handleRuleTypeChange = (ruleType: PromRuleType) => {
    updateFilters({ ...filterState, ruleType });
    setFilterKey((key) => key + 1);
  };

  const handleRuleHealthChange = (ruleHealth: RuleHealth) => {
    updateFilters({ ...filterState, ruleHealth });
    setFilterKey((key) => key + 1);
  };

  const handleClearFiltersClick = () => {
    setSearchQuery(undefined);
    onFilterCleared();

    setTimeout(() => setFilterKey(filterKey + 1), 100);
  };

  const searchIcon = <Icon name={'search'} />;
  return (
    <div className={styles.container}>
      <Stack direction="column" gap={1}>
        <Stack direction="row" gap={1}>
          <Field
            className={styles.dsPickerContainer}
            label={
              <Label htmlFor="data-source-picker">
                <Stack gap={0.5}>
                  <span>按数据源搜索</span>
                  <Tooltip
                    content={
                      <div>
                        <p>
                        包含已配置警报规则的数据源是 Mimir 或 Loki 数据源，其中警报规则在数据源本身中存储和计算。
                        </p>
                        <p>
                        在这些数据源中，可以选择“通过警报 UI 管理警报”，以便能够管理这些警报警报规则在 Grafana UI 以及配置它们的数据源中。
                        </p>
                      </div>
                    }
                  >
                    <Icon name="info-circle" size="sm" />
                  </Tooltip>
                </Stack>
              </Label>
            }
          >
            <MultipleDataSourcePicker
              key={dataSourceKey}
              alerting
              noDefault
              placeholder="所有数据源"
              current={filterState.dataSourceNames}
              onChange={handleDataSourceChange}
              onClear={clearDataSource}
            />
          </Field>

          <div>
            <Label>状态</Label>
            <RadioButtonGroup
              options={RuleStateOptions}
              value={filterState.ruleState}
              onChange={handleAlertStateChange}
            />
          </div>
          <div>
            <Label>规则类型</Label>
            <RadioButtonGroup options={RuleTypeOptions} value={filterState.ruleType} onChange={handleRuleTypeChange} />
          </div>
          <div>
            <Label>健康状态</Label>
            <RadioButtonGroup
              options={RuleHealthOptions}
              value={filterState.ruleHealth}
              onChange={handleRuleHealthChange}
            />
          </div>
        </Stack>
        <Stack direction="column" gap={1}>
          <Stack direction="row" gap={1}>
            <form
              className={styles.searchInput}
              onSubmit={handleSubmit((data) => {
                setSearchQuery(data.searchQuery);
                searchQueryRef.current?.blur();
              })}
            >
              <Field
                label={
                  <Label htmlFor="rulesSearchInput">
                    <Stack gap={0.5}>
                      <span>搜索</span>
                      <HoverCard content={<SearchQueryHelp />}>
                        <Icon name="info-circle" size="sm" tabIndex={0} />
                      </HoverCard>
                    </Stack>
                  </Label>
                }
              >
                <Input
                  id="rulesSearchInput"
                  key={queryStringKey}
                  prefix={searchIcon}
                  ref={(e) => {
                    ref(e);
                    searchQueryRef.current = e;
                  }}
                  {...rest}
                  placeholder="搜索"
                  data-testid="search-query-input"
                />
              </Field>
              <input type="submit" hidden />
            </form>
            <div>
              <Label>查看为</Label>
              <RadioButtonGroup
                options={ViewOptions}
                value={String(queryParams['view'] ?? ViewOptions[0].value)}
                onChange={handleViewChange}
              />
            </div>
          </Stack>
          {hasActiveFilters && (
            <div>
              <Button fullWidth={false} icon="times" variant="secondary" onClick={handleClearFiltersClick}>
                清除过滤器
              </Button>
            </div>
          )}
        </Stack>
      </Stack>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  return {
    container: css`
      margin-bottom: ${theme.spacing(1)};
    `,
    dsPickerContainer: css`
      width: 550px;
      flex-grow: 0;
      margin: 0;
    `,
    searchInput: css`
      flex: 1;
      margin: 0;
    `,
  };
};

function SearchQueryHelp() {
  const styles = useStyles2(helpStyles);

  return (
    <div>
      <div>搜索语法允许通过下面定义的参数查询警报规则。</div>
      <hr />
      <div className={styles.grid}>
        <div>过滤器类型</div>
        <div>表达式</div>
        <HelpRow title="数据源" expr="datasource:mimir datasource:prometheus" />
        <HelpRow title="文件夹/命名空间" expr="namespace:global" />
        <HelpRow title="群组" expr="group:cpu-usage" />
        <HelpRow title="规则" expr='rule:"cpu 80%"' />
        <HelpRow title="标签" expr="label:team=A label:cluster=a1" />
        <HelpRow title="状态" expr="state:firing|normal|pending" />
        <HelpRow title="类型" expr="type:alerting|recording" />
        <HelpRow title="健康" expr="health:ok|nodata|error" />
      </div>
    </div>
  );
}

function HelpRow({ title, expr }: { title: string; expr: string }) {
  const styles = useStyles2(helpStyles);

  return (
    <>
      <div>{title}</div>
      <code className={styles.code}>{expr}</code>
    </>
  );
}

const helpStyles = (theme: GrafanaTheme2) => ({
  grid: css`
    display: grid;
    grid-template-columns: max-content auto;
    gap: ${theme.spacing(1)};
    align-items: center;
  `,
  code: css`
    display: block;
    text-align: center;
  `,
});

export default RulesFilter;
