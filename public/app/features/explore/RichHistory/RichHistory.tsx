import { debounce } from 'lodash';
import React, { PureComponent } from 'react';

import { SelectableValue } from '@grafana/data';
import { Themeable2, TabbedContainer, TabConfig, withTheme2 } from '@grafana/ui';
import { SortOrder, RichHistorySearchFilters, RichHistorySettings } from 'app/core/utils/richHistory';
import { RichHistoryQuery } from 'app/types/explore';

import { supportedFeatures } from '../../../core/history/richHistoryStorageProvider';

import { RichHistoryQueriesTab } from './RichHistoryQueriesTab';
import { RichHistorySettingsTab } from './RichHistorySettingsTab';
import { RichHistoryStarredTab } from './RichHistoryStarredTab';

export enum Tabs {
  RichHistory = '历史查询',
  Starred = '已标星查询',
  Settings = '查询设置',
}

export const getSortOrderOptions = () =>
  [
    { label: '最新的优先', value: SortOrder.Descending },
    { label: '最早的在前', value: SortOrder.Ascending },
    { label: '数据源字母升序', value: SortOrder.DatasourceAZ },
    { label: '数据源字母降序', value: SortOrder.DatasourceZA },
  ].filter((option) => supportedFeatures().availableFilters.includes(option.value));

export interface RichHistoryProps extends Themeable2 {
  richHistory: RichHistoryQuery[];
  richHistoryTotal?: number;
  richHistorySettings: RichHistorySettings;
  richHistorySearchFilters?: RichHistorySearchFilters;
  updateHistorySettings: (settings: RichHistorySettings) => void;
  updateHistorySearchFilters: (exploreId: string, filters: RichHistorySearchFilters) => void;
  loadRichHistory: (exploreId: string) => void;
  loadMoreRichHistory: (exploreId: string) => void;
  clearRichHistoryResults: (exploreId: string) => void;
  deleteRichHistory: () => void;
  activeDatasourceInstance: string;
  firstTab: Tabs;
  exploreId: string;
  height: number;
  onClose: () => void;
}

type RichHistoryState = {
  loading: boolean;
};

class UnThemedRichHistory extends PureComponent<RichHistoryProps> {
  state: RichHistoryState = {
    loading: false,
  };

  updateSettings = (settingsToUpdate: Partial<RichHistorySettings>) => {
    this.props.updateHistorySettings({ ...this.props.richHistorySettings, ...settingsToUpdate });
  };

  updateFilters = (filtersToUpdate?: Partial<RichHistorySearchFilters>) => {
    const filters = {
      ...this.props.richHistorySearchFilters!,
      ...filtersToUpdate,
      page: 1, // always load fresh results when updating filters
    };
    this.props.updateHistorySearchFilters(this.props.exploreId, filters);
    this.loadRichHistory();
  };

  clearResults = () => {
    this.props.clearRichHistoryResults(this.props.exploreId);
  };

  loadRichHistory = debounce(() => {
    this.props.loadRichHistory(this.props.exploreId);
    this.setState({
      loading: true,
    });
  }, 300);

  onChangeRetentionPeriod = (retentionPeriod: SelectableValue<number>) => {
    if (retentionPeriod.value !== undefined) {
      this.updateSettings({ retentionPeriod: retentionPeriod.value });
    }
  };

  toggleStarredTabAsFirstTab = () =>
    this.updateSettings({ starredTabAsFirstTab: !this.props.richHistorySettings.starredTabAsFirstTab });

  toggleActiveDatasourceOnly = () =>
    this.updateSettings({ activeDatasourceOnly: !this.props.richHistorySettings.activeDatasourceOnly });

  componentDidUpdate(prevProps: Readonly<RichHistoryProps>) {
    if (prevProps.richHistory !== this.props.richHistory) {
      this.setState({
        loading: false,
      });
    }
  }

  render() {
    const {
      richHistory,
      richHistoryTotal,
      height,
      exploreId,
      deleteRichHistory,
      onClose,
      firstTab,
      activeDatasourceInstance,
    } = this.props;
    const { loading } = this.state;

    const QueriesTab: TabConfig = {
      label: '历史查询',
      value: Tabs.RichHistory,
      content: (
        <RichHistoryQueriesTab
          queries={richHistory}
          totalQueries={richHistoryTotal || 0}
          loading={loading}
          updateFilters={this.updateFilters}
          clearRichHistoryResults={() => this.props.clearRichHistoryResults(this.props.exploreId)}
          loadMoreRichHistory={() => this.props.loadMoreRichHistory(this.props.exploreId)}
          activeDatasourceInstance={activeDatasourceInstance}
          richHistorySettings={this.props.richHistorySettings}
          richHistorySearchFilters={this.props.richHistorySearchFilters}
          exploreId={exploreId}
          height={height}
        />
      ),
      icon: 'history',
    };

    const StarredTab: TabConfig = {
      label: '已标星查询',
      value: Tabs.Starred,
      content: (
        <RichHistoryStarredTab
          queries={richHistory}
          totalQueries={richHistoryTotal || 0}
          loading={loading}
          activeDatasourceInstance={activeDatasourceInstance}
          updateFilters={this.updateFilters}
          clearRichHistoryResults={() => this.props.clearRichHistoryResults(this.props.exploreId)}
          loadMoreRichHistory={() => this.props.loadMoreRichHistory(this.props.exploreId)}
          richHistorySettings={this.props.richHistorySettings}
          richHistorySearchFilters={this.props.richHistorySearchFilters}
          exploreId={exploreId}
        />
      ),
      icon: 'star',
    };

    const SettingsTab: TabConfig = {
      label: '查询设置',
      value: Tabs.Settings,
      content: (
        <RichHistorySettingsTab
          retentionPeriod={this.props.richHistorySettings.retentionPeriod}
          starredTabAsFirstTab={this.props.richHistorySettings.starredTabAsFirstTab}
          activeDatasourceOnly={this.props.richHistorySettings.activeDatasourceOnly}
          onChangeRetentionPeriod={this.onChangeRetentionPeriod}
          toggleStarredTabAsFirstTab={this.toggleStarredTabAsFirstTab}
          toggleactiveDatasourceOnly={this.toggleActiveDatasourceOnly}
          deleteRichHistory={deleteRichHistory}
        />
      ),
      icon: 'sliders-v-alt',
    };

    let tabs = [QueriesTab, StarredTab, SettingsTab];
    return (
      <TabbedContainer tabs={tabs} onClose={onClose} defaultTab={firstTab} closeIconTooltip="Close query history" />
    );
  }
}

export const RichHistory = withTheme2(UnThemedRichHistory);
