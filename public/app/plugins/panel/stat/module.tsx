import { PanelPlugin } from '@grafana/data';
import { BigValueColorMode, BigValueGraphMode, BigValueJustifyMode, BigValueTextMode } from '@grafana/schema';
import { commonOptionsBuilder, sharedSingleStatMigrationHandler } from '@grafana/ui';

import { statPanelChangedHandler } from './StatMigrations';
import { StatPanel } from './StatPanel';
import { addStandardDataReduceOptions, addOrientationOption } from './common';
import { defaultOptions, Options } from './panelcfg.gen';
import { StatSuggestionsSupplier } from './suggestions';

export const plugin = new PanelPlugin<Options>(StatPanel)
  .useFieldConfig()
  .setPanelOptions((builder) => {
    const mainCategory = ['数字样式'];

    addStandardDataReduceOptions(builder);
    addOrientationOption(builder, mainCategory);
    commonOptionsBuilder.addTextSizeOptions(builder);

    builder.addSelect({
      path: 'textMode',
      name: '文本模式',
      description: '控制是显示名称和值还是仅显示名称',
      category: mainCategory,
      settings: {
        options: [
          { value: BigValueTextMode.Auto, label: '自动' },
          { value: BigValueTextMode.Value, label: '值' },
          { value: BigValueTextMode.ValueAndName, label: '值和名称' },
          { value: BigValueTextMode.Name, label: '名称' },
          { value: BigValueTextMode.None, label: '无' },
        ],
      },
      defaultValue: defaultOptions.textMode,
    });

    builder
      .addSelect({
        path: 'colorMode',
        name: '颜色模式',
        defaultValue: BigValueColorMode.Value,
        category: mainCategory,
        settings: {
          options: [
            { value: BigValueColorMode.None, label: '无' },
            { value: BigValueColorMode.Value, label: '值' },
            { value: BigValueColorMode.Background, label: '背景透明度' },
            { value: BigValueColorMode.BackgroundSolid, label: '背景颜色' },
          ],
        },
      })
      .addRadio({
        path: 'graphMode',
        name: '图形模式',
        description: '统计信息面板图/迷你图模式',
        category: mainCategory,
        defaultValue: defaultOptions.graphMode,
        settings: {
          options: [
            { value: BigValueGraphMode.None, label: '无' },
            { value: BigValueGraphMode.Area, label: '面积' },
          ],
        },
      })
      .addRadio({
        path: 'justifyMode',
        name: '文本对齐方式',
        defaultValue: defaultOptions.justifyMode,
        category: mainCategory,
        settings: {
          options: [
            { value: BigValueJustifyMode.Auto, label: '自动' },
            { value: BigValueJustifyMode.Center, label: '居中' },
          ],
        },
      });
  })
  .setNoPadding()
  .setPanelChangeHandler(statPanelChangedHandler)
  .setSuggestionsSupplier(new StatSuggestionsSupplier())
  .setMigrationHandler(sharedSingleStatMigrationHandler);
