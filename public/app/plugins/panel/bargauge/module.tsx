import { PanelPlugin, VizOrientation } from '@grafana/data';
import { BarGaugeDisplayMode, BarGaugeValueMode } from '@grafana/schema';
import { commonOptionsBuilder, sharedSingleStatPanelChangedHandler } from '@grafana/ui';

import { addOrientationOption, addStandardDataReduceOptions } from '../stat/common';

import { barGaugePanelMigrationHandler } from './BarGaugeMigrations';
import { BarGaugePanel } from './BarGaugePanel';
import { Options, defaultOptions } from './panelcfg.gen';
import { BarGaugeSuggestionsSupplier } from './suggestions';

export const plugin = new PanelPlugin<Options>(BarGaugePanel)
  .useFieldConfig()
  .setPanelOptions((builder) => {
    addStandardDataReduceOptions(builder);
    addOrientationOption(builder);
    commonOptionsBuilder.addTextSizeOptions(builder);

    builder
      .addRadio({
        path: 'displayMode',
        name: '显示模式',
        settings: {
          options: [
            { value: BarGaugeDisplayMode.Gradient, label: '渐变' },
            { value: BarGaugeDisplayMode.Lcd, label: '复古液晶显示(LCD)' },
            { value: BarGaugeDisplayMode.Basic, label: '基本' },
          ],
        },
        defaultValue: defaultOptions.displayMode,
      })
      .addRadio({
        path: 'valueMode',
        name: '值显示',
        settings: {
          options: [
            { value: BarGaugeValueMode.Color, label: '值颜色' },
            { value: BarGaugeValueMode.Text, label: '文本颜色' },
            { value: BarGaugeValueMode.Hidden, label: '隐藏' },
          ],
        },
        defaultValue: defaultOptions.valueMode,
      })
      .addBooleanSwitch({
        path: 'showUnfilled',
        name: '显示未填充区域',
        description: '启用后，将未填充的区域呈现为灰色',
        defaultValue: defaultOptions.showUnfilled,
        showIf: (options) => options.displayMode !== 'lcd',
      })
      .addNumberInput({
        path: 'minVizWidth',
        name: '最小宽度',
        description: '最小列宽',
        defaultValue: defaultOptions.minVizWidth,
        showIf: (options) => options.orientation === VizOrientation.Vertical,
      })
      .addNumberInput({
        path: 'minVizHeight',
        name: '最小高度',
        description: '最小行高',
        defaultValue: defaultOptions.minVizHeight,
        showIf: (options) => options.orientation === VizOrientation.Horizontal,
      });
  })
  .setPanelChangeHandler(sharedSingleStatPanelChangedHandler)
  .setMigrationHandler(barGaugePanelMigrationHandler)
  .setSuggestionsSupplier(new BarGaugeSuggestionsSupplier());
