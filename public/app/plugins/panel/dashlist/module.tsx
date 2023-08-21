import React from 'react';

import { PanelModel, PanelPlugin } from '@grafana/data';
import { TagsInput } from '@grafana/ui';

import {
  ALL_FOLDER,
  GENERAL_FOLDER,
  ReadonlyFolderPicker,
} from '../../../core/components/Select/ReadonlyFolderPicker/ReadonlyFolderPicker';

import { DashList } from './DashList';
import { defaultOptions, Options } from './panelcfg.gen';

export const plugin = new PanelPlugin<Options>(DashList)
  .setPanelOptions((builder) => {
    builder
      .addBooleanSwitch({
        path: 'keepTime',
        name: '包括当前时间范围',
        defaultValue: defaultOptions.keepTime,
      })
      .addBooleanSwitch({
        path: 'includeVars',
        name: '包括当前模板变量值',
        defaultValue: defaultOptions.includeVars,
      })
      .addBooleanSwitch({
        path: 'showStarred',
        name: '已标星',
        defaultValue: defaultOptions.showStarred,
      })
      .addBooleanSwitch({
        path: 'showRecentlyViewed',
        name: '最近查看',
        defaultValue: defaultOptions.showRecentlyViewed,
      })
      .addBooleanSwitch({
        path: 'showSearch',
        name: '搜索',
        defaultValue: defaultOptions.showSearch,
      })
      .addBooleanSwitch({
        path: 'showHeadings',
        name: 'Show headings',
        defaultValue: defaultOptions.showHeadings,
      })
      .addNumberInput({
        path: 'maxItems',
        name: '最大条目数',
        defaultValue: defaultOptions.maxItems,
      })
      .addTextInput({
        path: 'query',
        name: '查询',
        defaultValue: defaultOptions.query,
      })
      .addCustomEditor({
        path: 'folderId',
        name: '文件夹',
        id: 'folderId',
        defaultValue: undefined,
        editor: function RenderFolderPicker({ value, onChange }) {
          return (
            <ReadonlyFolderPicker
              initialFolderId={value}
              onChange={(folder) => onChange(folder?.id)}
              extraFolders={[ALL_FOLDER, GENERAL_FOLDER]}
            />
          );
        },
      })
      .addCustomEditor({
        id: 'tags',
        path: 'tags',
        name: '标签',
        description: '',
        defaultValue: defaultOptions.tags,
        editor(props) {
          return <TagsInput tags={props.value} onChange={props.onChange} />;
        },
      });
  })
  .setMigrationHandler((panel: PanelModel<Options> & Record<string, any>) => {
    const newOptions = {
      showStarred: panel.options.showStarred ?? panel.starred,
      showRecentlyViewed: panel.options.showRecentlyViewed ?? panel.recent,
      showSearch: panel.options.showSearch ?? panel.search,
      showHeadings: panel.options.showHeadings ?? panel.headings,
      maxItems: panel.options.maxItems ?? panel.limit,
      query: panel.options.query ?? panel.query,
      folderId: panel.options.folderId ?? panel.folderId,
      tags: panel.options.tags ?? panel.tags,
    };

    const previousVersion = parseFloat(panel.pluginVersion || '6.1');
    if (previousVersion < 6.3) {
      const oldProps = ['starred', 'recent', 'search', 'headings', 'limit', 'query', 'folderId'];
      oldProps.forEach((prop) => delete panel[prop]);
    }

    return newOptions;
  });
