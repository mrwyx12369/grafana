import React, { useEffect } from 'react';
import { connect, ConnectedProps } from 'react-redux';

import { CoreApp, TimeZone } from '@grafana/data';
import { reportInteraction } from '@grafana/runtime/src';
import { TabbedContainer, TabConfig } from '@grafana/ui';
import { ExploreDrawer } from 'app/features/explore/ExploreDrawer';
import { InspectDataTab } from 'app/features/inspector/InspectDataTab';
import { InspectErrorTab } from 'app/features/inspector/InspectErrorTab';
import { InspectJSONTab } from 'app/features/inspector/InspectJSONTab';
import { InspectStatsTab } from 'app/features/inspector/InspectStatsTab';
import { QueryInspector } from 'app/features/inspector/QueryInspector';
import { StoreState, ExploreItemState } from 'app/types';

import { runQueries, selectIsWaitingForData } from './state/query';

interface DispatchProps {
  width: number;
  exploreId: string;
  timeZone: TimeZone;
  onClose: () => void;
}

type Props = DispatchProps & ConnectedProps<typeof connector>;

export function ExploreQueryInspector(props: Props) {
  const { loading, width, onClose, queryResponse, timeZone } = props;
  const dataFrames = queryResponse?.series || [];
  let errors = queryResponse?.errors;
  if (!errors?.length && queryResponse?.error) {
    errors = [queryResponse.error];
  }

  useEffect(() => {
    reportInteraction('grafana_explore_query_inspector_opened');
  }, []);

  const statsTab: TabConfig = {
    label: '统计',
    value: 'stats',
    icon: 'chart-line',
    content: <InspectStatsTab data={queryResponse!} timeZone={queryResponse?.request?.timezone as TimeZone} />,
  };

  const jsonTab: TabConfig = {
    label: 'JSON',
    value: 'json',
    icon: 'brackets-curly',
    content: <InspectJSONTab data={queryResponse} onClose={onClose} />,
  };

  const dataTab: TabConfig = {
    label: '数据',
    value: 'data',
    icon: 'database',
    content: (
      <InspectDataTab
        data={dataFrames}
        isLoading={loading}
        options={{ withTransforms: false, withFieldConfig: false }}
        timeZone={timeZone}
        app={CoreApp.Explore}
      />
    ),
  };

  const queryTab: TabConfig = {
    label: '查询',
    value: 'query',
    icon: 'info-circle',
    content: (
      <QueryInspector data={dataFrames} onRefreshQuery={() => props.runQueries({ exploreId: props.exploreId })} />
    ),
  };

  const tabs = [statsTab, queryTab, jsonTab, dataTab];
  if (errors?.length) {
    const errorTab: TabConfig = {
      label: '错误',
      value: 'error',
      icon: 'exclamation-triangle',
      content: <InspectErrorTab errors={errors} />,
    };
    tabs.push(errorTab);
  }
  return (
    <ExploreDrawer width={width}>
      <TabbedContainer tabs={tabs} onClose={onClose} closeIconTooltip="关闭查询检查器" />
    </ExploreDrawer>
  );
}

function mapStateToProps(state: StoreState, { exploreId }: { exploreId: string }) {
  const explore = state.explore;
  const item: ExploreItemState = explore.panes[exploreId]!;
  const { queryResponse } = item;

  return {
    loading: selectIsWaitingForData(exploreId)(state),
    queryResponse,
  };
}

const mapDispatchToProps = {
  runQueries,
};

const connector = connect(mapStateToProps, mapDispatchToProps);

export default connector(ExploreQueryInspector);
