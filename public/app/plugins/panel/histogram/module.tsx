import { FieldColorModeId, FieldConfigProperty, PanelPlugin } from '@grafana/data';
import { histogramFieldInfo } from '@grafana/data/src/transformations/transformers/histogram';
import { commonOptionsBuilder, graphFieldOptions } from '@grafana/ui';

import { HistogramPanel } from './HistogramPanel';
import { FieldConfig, Options, defaultFieldConfig, defaultOptions } from './panelcfg.gen';
import { originalDataHasHistogram } from './utils';

export const plugin = new PanelPlugin<Options, FieldConfig>(HistogramPanel)
  .setPanelOptions((builder) => {
    builder
      .addCustomEditor({
        id: '__calc__',
        path: '__calc__',
        name: '值',
        description: 'Showing frequencies that are calculated in the query',
        editor: () => null, // empty editor
        showIf: (opts, data) => originalDataHasHistogram(data),
      })
      .addNumberInput({
        path: '桶大小',
        name: histogramFieldInfo.bucketSize.name,
        description: histogramFieldInfo.bucketSize.description,
        settings: {
          placeholder: '自动',
          min: 0,
        },
        defaultValue: defaultOptions.bucketSize,
        showIf: (opts, data) => !originalDataHasHistogram(data),
      })
      .addNumberInput({
        path: '桶偏移量',
        name: histogramFieldInfo.bucketOffset.name,
        description: histogramFieldInfo.bucketOffset.description,
        settings: {
          placeholder: '0',
          min: 0,
        },
        defaultValue: defaultOptions.bucketOffset,
        showIf: (opts, data) => !originalDataHasHistogram(data),
      })
      .addBooleanSwitch({
        path: '组合',
        name: histogramFieldInfo.combine.name,
        description: histogramFieldInfo.combine.description,
        defaultValue: defaultOptions.combine,
        showIf: (opts, data) => !originalDataHasHistogram(data),
      });

    // commonOptionsBuilder.addTooltipOptions(builder);
    commonOptionsBuilder.addLegendOptions(builder);
  })
  .useFieldConfig({
    standardOptions: {
      [FieldConfigProperty.Color]: {
        settings: {
          byValueSupport: true,
        },
        defaultValue: {
          mode: FieldColorModeId.PaletteClassic,
        },
      },
    },
    useCustomConfig: (builder) => {
      const cfg = defaultFieldConfig;

      builder
        .addSliderInput({
          path: 'lineWidth',
          name: '线宽',
          defaultValue: cfg.lineWidth,
          settings: {
            min: 0,
            max: 10,
            step: 1,
          },
        })
        .addSliderInput({
          path: 'fillOpacity',
          name: '填充透明度',
          defaultValue: cfg.fillOpacity,
          settings: {
            min: 0,
            max: 100,
            step: 1,
          },
        })
        .addRadio({
          path: 'gradientMode',
          name: '渐变模式',
          defaultValue: graphFieldOptions.fillGradient[0].value,
          settings: {
            options: graphFieldOptions.fillGradient,
          },
        });

      commonOptionsBuilder.addHideFrom(builder);
    },
  });
