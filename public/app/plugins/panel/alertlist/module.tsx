import React from 'react';

import { DataSourceInstanceSettings, PanelPlugin } from '@grafana/data';
import { config } from '@grafana/runtime';
import { TagsInput } from '@grafana/ui';
import { OldFolderPicker } from 'app/core/components/Select/OldFolderPicker';
import {
  ALL_FOLDER,
  GENERAL_FOLDER,
  ReadonlyFolderPicker,
} from 'app/core/components/Select/ReadonlyFolderPicker/ReadonlyFolderPicker';
import { DataSourcePicker } from 'app/features/datasources/components/picker/DataSourcePicker';
import { PermissionLevelString } from 'app/types';

import { GRAFANA_DATASOURCE_NAME } from '../../../features/alerting/unified/utils/datasource';

import { AlertList } from './AlertList';
import { alertListPanelMigrationHandler } from './AlertListMigrationHandler';
import { GroupBy } from './GroupByWithLoading';
import { UnifiedAlertList } from './UnifiedAlertList';
import { AlertListSuggestionsSupplier } from './suggestions';
import { AlertListOptions, GroupMode, ShowOption, SortOrder, UnifiedAlertListOptions, ViewMode } from './types';

function showIfCurrentState(options: AlertListOptions) {
  return options.showOptions === ShowOption.Current;
}

const alertList = new PanelPlugin<AlertListOptions>(AlertList)
  .setPanelOptions((builder) => {
    builder
      .addSelect({
        name: 'Show',
        path: '显示选项',
        settings: {
          options: [
            { label: '当前状态', value: ShowOption.Current },
            { label: '最近状态变化', value: ShowOption.RecentChanges },
          ],
        },
        defaultValue: ShowOption.Current,
        category: ['选项'],
      })
      .addNumberInput({
        name: '最大项目数',
        path: 'maxItems',
        defaultValue: 10,
        category: ['选项'],
      })
      .addSelect({
        name: '排序顺序',
        path: 'sortOrder',
        settings: {
          options: [
            { label: '按字母顺序（升序）', value: SortOrder.AlphaAsc },
            { label: '按字母顺序 (降序)', value: SortOrder.AlphaDesc },
            { label: '重要程度', value: SortOrder.Importance },
            { label: '时间(升序)', value: SortOrder.TimeAsc },
            { label: '时间(降序)', value: SortOrder.TimeDesc },
          ],
        },
        defaultValue: SortOrder.AlphaAsc,
        category: ['选项'],
      })
      .addBooleanSwitch({
        path: 'dashboardAlerts',
        name: 'Alerts from this dashboard',
        defaultValue: false,
        category: ['选项'],
      })
      .addTextInput({
        path: 'alertName',
        name: '警报名称',
        defaultValue: '',
        category: ['过滤器'],
        showIf: showIfCurrentState,
      })
      .addTextInput({
        path: 'dashboardTitle',
        name: '仪表板标题',
        defaultValue: '',
        category: ['过滤器'],
        showIf: showIfCurrentState,
      })
      .addCustomEditor({
        path: 'folderId',
        name: '文件夹',
        id: 'folderId',
        defaultValue: null,
        editor: function RenderFolderPicker({ value, onChange }) {
          return (
            <ReadonlyFolderPicker
              initialFolderId={value}
              onChange={(folder) => onChange(folder?.id)}
              extraFolders={[ALL_FOLDER, GENERAL_FOLDER]}
            />
          );
        },
        category: ['过滤器'],
        showIf: showIfCurrentState,
      })
      .addCustomEditor({
        id: 'tags',
        path: 'tags',
        name: '标签',
        description: '',
        defaultValue: [],
        editor(props) {
          return <TagsInput tags={props.value} onChange={props.onChange} />;
        },
        category: ['过滤器'],
        showIf: showIfCurrentState,
      })
      .addBooleanSwitch({
        path: 'stateFilter.ok',
        name: 'Ok',
        defaultValue: false,
        category: ['状态过滤器'],
        showIf: showIfCurrentState,
      })
      .addBooleanSwitch({
        path: 'stateFilter.paused',
        name: '暂停',
        defaultValue: false,
        category: ['状态过滤器'],
        showIf: showIfCurrentState,
      })
      .addBooleanSwitch({
        path: 'stateFilter.no_data',
        name: '暂无数据',
        defaultValue: false,
        category: ['状态过滤器'],
        showIf: showIfCurrentState,
      })
      .addBooleanSwitch({
        path: 'stateFilter.execution_error',
        name: '执行错误',
        defaultValue: false,
        category: ['状态过滤器'],
        showIf: showIfCurrentState,
      })
      .addBooleanSwitch({
        path: 'stateFilter.alerting',
        name: '警报',
        defaultValue: false,
        category: ['状态过滤器'],
        showIf: showIfCurrentState,
      })
      .addBooleanSwitch({
        path: 'stateFilter.pending',
        name: '等待',
        defaultValue: false,
        category: ['状态过滤器'],
        showIf: showIfCurrentState,
      });
  })
  .setMigrationHandler(alertListPanelMigrationHandler)
  .setSuggestionsSupplier(new AlertListSuggestionsSupplier());

const unifiedAlertList = new PanelPlugin<UnifiedAlertListOptions>(UnifiedAlertList).setPanelOptions((builder) => {
  builder
    .addRadio({
      path: 'viewMode',
      name: '查看模式',
      description: '在列表视图和统计信息视图之间切换',
      defaultValue: ViewMode.List,
      settings: {
        options: [
          { label: '列表', value: ViewMode.List },
          { label: '数字', value: ViewMode.Stat },
        ],
      },
      category: ['选项'],
    })
    .addRadio({
      path: 'groupMode',
      name: '组模式',
      description: '警报实例应如何分组',
      defaultValue: GroupMode.Default,
      settings: {
        options: [
          { value: GroupMode.Default, label: '默认分组' },
          { value: GroupMode.Custom, label: '自定义分组' },
        ],
      },
      category: ['选项'],
    })
    .addCustomEditor({
      path: 'groupBy',
      name: '分组',
      description: '使用标签查询筛选警报',
      id: 'groupBy',
      defaultValue: [],
      showIf: (options) => options.groupMode === GroupMode.Custom,
      category: ['选项'],
      editor: (props) => {
        return (
          <GroupBy
            id={props.id ?? 'groupBy'}
            defaultValue={props.value.map((value: string) => ({ label: value, value }))}
            onChange={props.onChange}
            dataSource={props.context.options.datasource}
          />
        );
      },
    })
    .addNumberInput({
      name: '最大项目数',
      path: 'maxItems',
      description: '要显示的最大警报数',
      defaultValue: 20,
      category: ['选项'],
    })
    .addSelect({
      name: '排序顺序',
      path: 'sortOrder',
      description: '警报和警报实例的排序顺序',
      settings: {
        options: [
          { label: '按字母顺序（升序）', value: SortOrder.AlphaAsc },
          { label: '按字母顺序 (降序)', value: SortOrder.AlphaDesc },
          { label: '重要程度', value: SortOrder.Importance },
          { label: '时间(升序)', value: SortOrder.TimeAsc },
          { label: '时间(降序)', value: SortOrder.TimeDesc },
        ],
      },
      defaultValue: SortOrder.AlphaAsc,
      category: ['选项'],
    })
    .addBooleanSwitch({
      path: 'dashboardAlerts',
      name: '来自此仪表板的警报',
      description: '显示来自此仪表板的警报',
      defaultValue: false,
      category: ['选项'],
    })
    .addTextInput({
      path: 'alertName',
      name: '警报名称',
      description: '筛选包含此文本的警报',
      defaultValue: '',
      category: ['过滤器'],
    })
    .addTextInput({
      path: 'alertInstanceLabelFilter',
      name: '报警实例标签',
      description: '使用标签查询筛选警报实例，例如：{severity="critical", instance=~"cluster-us-.+"}',
      defaultValue: '',
      category: ['过滤器'],
    })
    .addCustomEditor({
      path: 'datasource',
      name: '数据源',
      description: '筛选来自所选数据源的警报',
      id: 'datasource',
      defaultValue: null,
      editor: function RenderDatasourcePicker(props) {
        return (
          <DataSourcePicker
            {...props}
            type={['prometheus', 'loki', 'grafana']}
            noDefault
            current={props.value}
            onChange={(ds: DataSourceInstanceSettings) => props.onChange(ds.name)}
            onClear={() => props.onChange(null)}
          />
        );
      },
      category: ['过滤器'],
    })
    .addCustomEditor({
      showIf: (options) => options.datasource === GRAFANA_DATASOURCE_NAME || !Boolean(options.datasource),
      path: 'folder',
      name: '文件夹',
      description: '筛选所选文件夹中的警报（仅适用于警报）',
      id: 'folder',
      defaultValue: null,
      editor: function RenderFolderPicker(props) {
        return (
          <OldFolderPicker
            enableReset={true}
            showRoot={false}
            allowEmpty={true}
            initialTitle={props.value?.title}
            initialFolderUid={props.value?.uid}
            permissionLevel={PermissionLevelString.View}
            onClear={() => props.onChange('')}
            {...props}
          />
        );
      },
      category: ['过滤器'],
    })
    .addBooleanSwitch({
      path: 'stateFilter.firing',
      name: '警报/触发',
      defaultValue: true,
      category: ['警报状态过滤器'],
    })
    .addBooleanSwitch({
      path: 'stateFilter.pending',
      name: '等待',
      defaultValue: true,
      category: ['警报状态过滤器'],
    })
    .addBooleanSwitch({
      path: 'stateFilter.noData',
      name: '暂无数据',
      defaultValue: false,
      category: ['警报状态过滤器'],
    })
    .addBooleanSwitch({
      path: 'stateFilter.normal',
      name: '正常',
      defaultValue: false,
      category: ['警报状态过滤器'],
    })
    .addBooleanSwitch({
      path: 'stateFilter.error',
      name: '错误',
      defaultValue: true,
      category: ['警报状态过滤器'],
    });
});

export const plugin = config.unifiedAlertingEnabled ? unifiedAlertList : alertList;
