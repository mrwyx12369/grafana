import {
  DataFrame,
  FieldColorModeId,
  FieldConfigProperty,
  FieldType,
  getFieldDisplayName,
  identityOverrideProcessor,
  PanelPlugin,
  VizOrientation,
} from '@grafana/data';
import { config } from '@grafana/runtime';
import { GraphTransform, GraphTresholdsStyleMode, StackingMode, VisibilityMode } from '@grafana/schema';
import { graphFieldOptions, commonOptionsBuilder } from '@grafana/ui';

import { ThresholdsStyleEditor } from '../timeseries/ThresholdsStyleEditor';

import { BarChartPanel } from './BarChartPanel';
import { TickSpacingEditor } from './TickSpacingEditor';
import { FieldConfig, Options, defaultFieldConfig, defaultOptions } from './panelcfg.gen';
import { BarChartSuggestionsSupplier } from './suggestions';
import { prepareBarChartDisplayValues } from './utils';

export const plugin = new PanelPlugin<Options, FieldConfig>(BarChartPanel)
  .useFieldConfig({
    standardOptions: {
      [FieldConfigProperty.Color]: {
        settings: {
          byValueSupport: true,
          preferThresholdsMode: false,
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
          name: '填充不透明度',
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

      builder.addSelect({
        category: ['图形样式'],
        name: '转换',
        path: 'transform',
        settings: {
          options: [
            {
              label: '常量',
              value: GraphTransform.Constant,
              description: '第一个值将显示为常量线',
            },
            {
              label: '负Y轴',
              value: GraphTransform.NegativeY,
              description: '将结果翻转为Y轴上的负值',
            },
          ],
          isClearable: true,
        },
        hideFromDefaults: true,
      });

      builder.addCustomEditor({
        id: 'thresholdsStyle',
        path: 'thresholdsStyle',
        name: '显示阈值',
        category: ['阈值'],
        defaultValue: { mode: GraphTresholdsStyleMode.Off },
        settings: {
          options: graphFieldOptions.thresholdsDisplayModes,
        },
        editor: ThresholdsStyleEditor,
        override: ThresholdsStyleEditor,
        process: identityOverrideProcessor,
        shouldApply: () => true,
      });

      commonOptionsBuilder.addAxisConfig(builder, cfg, false);
      commonOptionsBuilder.addHideFrom(builder);
    },
  })
  .setPanelOptions((builder, context) => {
    const disp = prepareBarChartDisplayValues(context.data, config.theme2, context.options ?? ({} as Options));
    let xaxisPlaceholder = '第一个字符串或时间字段';
    const viz = 'viz' in disp ? disp.viz[0] : undefined;
    if (viz?.fields?.length) {
      const first = viz.fields[0];
      xaxisPlaceholder += ` (${getFieldDisplayName(first, viz)})`;
    }

    builder
      .addFieldNamePicker({
        path: 'xField',
        name: 'X轴',
        settings: {
          placeholderText: xaxisPlaceholder,
        },
      })
      .addRadio({
        path: 'orientation',
        name: '方向',
        settings: {
          options: [
            { value: VizOrientation.Auto, label: '自动' },
            { value: VizOrientation.Horizontal, label: '水平' },
            { value: VizOrientation.Vertical, label: '垂直' },
          ],
        },
        defaultValue: defaultOptions.orientation,
      })
      .addSliderInput({
        path: 'xTickLabelRotation',
        name: '旋转X轴刻度标签',
        defaultValue: defaultOptions.xTickLabelRotation,
        settings: {
          min: -90,
          max: 90,
          step: 15,
          marks: { '-90': '-90°', '-45': '-45°', 0: '0°', 45: '45°', 90: '90°' },
          included: false,
        },
      })
      .addNumberInput({
        path: 'xTickLabelMaxLength',
        name: 'X轴刻度标签最大长度',
        description: 'X轴标签将被截断为提供的长度',
        settings: {
          placeholder: '无',
          min: 0,
        },
        showIf: (opts) => opts.xTickLabelRotation !== 0,
      })
      .addCustomEditor({
        id: 'xTickLabelSpacing',
        path: 'xTickLabelSpacing',
        name: 'X轴标签最小间距',
        defaultValue: defaultOptions.xTickLabelSpacing,
        editor: TickSpacingEditor,
      })
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
        defaultValue: defaultOptions.showValue,
      })
      .addRadio({
        path: 'stacking',
        name: '堆叠',
        settings: {
          options: graphFieldOptions.stacking,
        },
        defaultValue: defaultOptions.stacking,
      })
      .addSliderInput({
        path: 'groupWidth',
        name: '组宽度',
        defaultValue: defaultOptions.groupWidth,
        settings: {
          min: 0,
          max: 1,
          step: 0.01,
        },
        showIf: (c, data) => {
          if (c.stacking && c.stacking !== StackingMode.None) {
            return false;
          }
          return countNumberFields(data) !== 1;
        },
      })
      .addSliderInput({
        path: 'barWidth',
        name: '条形图宽度',
        defaultValue: defaultOptions.barWidth,
        settings: {
          min: 0,
          max: 1,
          step: 0.01,
        },
      })
      .addSliderInput({
        path: 'barRadius',
        name: '条形图边半径',
        defaultValue: defaultOptions.barRadius,
        settings: {
          min: 0,
          max: 0.5,
          step: 0.05,
        },
      })
      .addBooleanSwitch({
        path: 'fullHighlight',
        name: '悬停时突出显示整个区域',
        defaultValue: defaultOptions.fullHighlight,
      });

    builder.addFieldNamePicker({
      path: 'colorByField',
      name: '按字段着色',
      description: '使用同级字段的颜色值为每个条形值着色。',
    });

    if (!context.options?.fullHighlight || context.options?.stacking === StackingMode.None) {
      commonOptionsBuilder.addTooltipOptions(builder);
    }

    commonOptionsBuilder.addLegendOptions(builder);
    commonOptionsBuilder.addTextSizeOptions(builder, false);
  })
  .setSuggestionsSupplier(new BarChartSuggestionsSupplier());

function countNumberFields(data?: DataFrame[]): number {
  let count = 0;
  if (data) {
    for (const frame of data) {
      for (const field of frame.fields) {
        if (field.type === FieldType.number) {
          count++;
        }
      }
    }
  }
  return count;
}
