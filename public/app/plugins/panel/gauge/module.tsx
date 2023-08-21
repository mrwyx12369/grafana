import { PanelPlugin } from '@grafana/data';
import { commonOptionsBuilder } from '@grafana/ui';

import { addOrientationOption, addStandardDataReduceOptions } from '../stat/common';

import { gaugePanelMigrationHandler, gaugePanelChangedHandler } from './GaugeMigrations';
import { GaugePanel } from './GaugePanel';
import { Options, defaultOptions } from './panelcfg.gen';
import { GaugeSuggestionsSupplier } from './suggestions';

export const plugin = new PanelPlugin<Options>(GaugePanel)
  .useFieldConfig({
    useCustomConfig: (builder) => {
      builder.addNumberInput({
        path: 'neutral',
        name: '中性点',
        description: '留空以使用最小值作为中性点',
        category: ['仪表图'],
        settings: {
          placeholder: '自动',
        },
      });
    },
  })
  .setPanelOptions((builder) => {
    addStandardDataReduceOptions(builder);
    addOrientationOption(builder);
    builder
      .addBooleanSwitch({
        path: 'showThresholdLabels',
        name: '显示阈值标签',
        description: '呈现仪表条周围的阈值',
        defaultValue: defaultOptions.showThresholdLabels,
      })
      .addBooleanSwitch({
        path: 'showThresholdMarkers',
        name: '显示阈值标记',
        description: '将阈值呈现为外部栏',
        defaultValue: defaultOptions.showThresholdMarkers,
      });

    commonOptionsBuilder.addTextSizeOptions(builder);
  })
  .setPanelChangeHandler(gaugePanelChangedHandler)
  .setSuggestionsSupplier(new GaugeSuggestionsSupplier())
  .setMigrationHandler(gaugePanelMigrationHandler);
