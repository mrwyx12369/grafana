import { FieldColorModeId, FieldConfigProperty, PanelPlugin } from '@grafana/data';
import { VisibilityMode } from '@grafana/schema';
import { commonOptionsBuilder } from '@grafana/ui';

import { StatusHistoryPanel } from './StatusHistoryPanel';
import { Options, FieldConfig, defaultFieldConfig } from './panelcfg.gen';
import { StatusHistorySuggestionsSupplier } from './suggestions';

export const plugin = new PanelPlugin<Options, FieldConfig>(StatusHistoryPanel)
  .useFieldConfig({
    standardOptions: {
      [FieldConfigProperty.Color]: {
        settings: {
          byValueSupport: true,
        },
        defaultValue: {
          mode: FieldColorModeId.Thresholds,
        },
      },
    },
    useCustomConfig: (builder) => {
      builder
        .addSliderInput({
          path: 'lineWidth',
          name: '线宽',
          defaultValue: defaultFieldConfig.lineWidth,
          settings: {
            min: 0,
            max: 10,
            step: 1,
          },
        })
        .addSliderInput({
          path: 'fillOpacity',
          name: '填充透明度',
          defaultValue: defaultFieldConfig.fillOpacity,
          settings: {
            min: 0,
            max: 100,
            step: 1,
          },
        });

      commonOptionsBuilder.addHideFrom(builder);
    },
  })
  .setPanelOptions((builder) => {
    builder
      .addRadio({
        path: 'showValue',
        name: '显示值',
        settings: {
          options: [
            { value: VisibilityMode.Auto, label: '自动' },
            { value: VisibilityMode.Always, label: '总是' },
            { value: VisibilityMode.Never, label: '从不' },
          ],
        },
        defaultValue: VisibilityMode.Auto,
      })
      .addSliderInput({
        path: 'rowHeight',
        name: '行高',
        defaultValue: 0.9,
        settings: {
          min: 0,
          max: 1,
          step: 0.01,
        },
      })
      .addSliderInput({
        path: 'colWidth',
        name: 'Column width',
        defaultValue: 0.9,
        settings: {
          min: 0,
          max: 1,
          step: 0.01,
        },
      });

    commonOptionsBuilder.addLegendOptions(builder, false);
    commonOptionsBuilder.addTooltipOptions(builder, true);
  })
  .setSuggestionsSupplier(new StatusHistorySuggestionsSupplier());
