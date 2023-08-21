import React from 'react';

import { FieldConfigProperty, FieldType, identityOverrideProcessor, PanelPlugin } from '@grafana/data';
import { config } from '@grafana/runtime';
import {
  AxisPlacement,
  GraphFieldConfig,
  ScaleDistribution,
  ScaleDistributionConfig,
  HeatmapCellLayout,
} from '@grafana/schema';
import { addHideFrom, ScaleDistributionEditor } from '@grafana/ui/src/options/builder';
import { ColorScale } from 'app/core/components/ColorScale/ColorScale';
import { addHeatmapCalculationOptions } from 'app/features/transformers/calculateHeatmap/editor/helper';
import { readHeatmapRowsCustomMeta } from 'app/features/transformers/calculateHeatmap/heatmap';

import { HeatmapPanel } from './HeatmapPanel';
import { prepareHeatmapData } from './fields';
import { heatmapChangedHandler, heatmapMigrationHandler } from './migrations';
import { colorSchemes, quantizeScheme } from './palettes';
import { HeatmapSuggestionsSupplier } from './suggestions';
import { Options, defaultOptions, HeatmapColorMode, HeatmapColorScale } from './types';

export const plugin = new PanelPlugin<Options, GraphFieldConfig>(HeatmapPanel)
  .useFieldConfig({
    disableStandardOptions: Object.values(FieldConfigProperty).filter((v) => v !== FieldConfigProperty.Links),
    useCustomConfig: (builder) => {
      builder.addCustomEditor<void, ScaleDistributionConfig>({
        id: 'scaleDistribution',
        path: 'scaleDistribution',
        name: 'Y轴刻度',
        category: ['热力图'],
        editor: ScaleDistributionEditor as any,
        override: ScaleDistributionEditor as any,
        defaultValue: { type: ScaleDistribution.Linear },
        shouldApply: (f) => f.type === FieldType.number,
        process: identityOverrideProcessor,
        hideFromDefaults: true,
      });
      addHideFrom(builder); // for tooltip etc
    },
  })
  .setPanelChangeHandler(heatmapChangedHandler)
  .setMigrationHandler(heatmapMigrationHandler)
  .setPanelOptions((builder, context) => {
    const opts = context.options ?? defaultOptions;

    let isOrdinalY = false;

    if (context.data.length > 0) {
      try {
        // NOTE: this feels like overkill/expensive just to assert if we have an ordinal y
        // can probably simplify without doing full dataprep
        const palette = quantizeScheme(opts.color, config.theme2);
        const v = prepareHeatmapData(context.data, undefined, opts, palette, config.theme2);
        isOrdinalY = readHeatmapRowsCustomMeta(v.heatmap).yOrdinalDisplay != null;
      } catch {}
    }

    let category = ['热力图'];

    builder.addRadio({
      path: 'calculate',
      name: '根据数据计算',
      defaultValue: defaultOptions.calculate,
      category,
      settings: {
        options: [
          { label: '是', value: true },
          { label: '否', value: false },
        ],
      },
    });

    if (opts.calculate) {
      addHeatmapCalculationOptions('calculation.', builder, opts.calculation, category);
    }

    category = ['Y轴'];

    builder
      .addRadio({
        path: 'yAxis.axisPlacement',
        name: 'Y轴位置',
        defaultValue: defaultOptions.yAxis.axisPlacement ?? AxisPlacement.Left,
        category,
        settings: {
          options: [
            { label: '靠左', value: AxisPlacement.Left },
            { label: '靠右', value: AxisPlacement.Right },
            { label: '隐藏', value: AxisPlacement.Hidden },
          ],
        },
      })
      .addUnitPicker({
        category,
        path: 'yAxis.unit',
        name: 'Y轴计量单位',
        defaultValue: undefined,
        settings: {
          isClearable: true,
        },
      })
      .addNumberInput({
        category,
        path: 'yAxis.decimals',
        name: 'Y轴小数',
        settings: {
          placeholder: '自动',
        },
      });

    if (!isOrdinalY) {
      // if undefined, then show the min+max
      builder
        .addNumberInput({
          path: 'yAxis.min',
          name: 'Y轴最小值',
          settings: {
            placeholder: '自动',
          },
          category,
        })
        .addTextInput({
          path: 'yAxis.max',
          name: 'Y轴最大值',
          settings: {
            placeholder: '自动',
          },
          category,
        });
    }

    builder
      .addNumberInput({
        path: 'yAxis.axisWidth',
        name: 'Y轴宽度',
        defaultValue: defaultOptions.yAxis.axisWidth,
        settings: {
          placeholder: '自动',
          min: 5, // smaller should just be hidden
        },
        category,
      })
      .addTextInput({
        path: 'yAxis.axisLabel',
        name: 'Y轴标签',
        defaultValue: defaultOptions.yAxis.axisLabel,
        settings: {
          placeholder: '自动',
        },
        category,
      });

    if (!opts.calculate) {
      builder.addRadio({
        path: 'rowsFrame.layout',
        name: '刻度对齐',
        defaultValue: defaultOptions.rowsFrame?.layout ?? HeatmapCellLayout.auto,
        category,
        settings: {
          options: [
            { label: '自动', value: HeatmapCellLayout.auto },
            { label: '上界(小于等于)', value: HeatmapCellLayout.le },
            { label: '中位数', value: HeatmapCellLayout.unknown },
            { label: '下界(大于等于)', value: HeatmapCellLayout.ge },
          ],
        },
      });
    }
    builder.addBooleanSwitch({
      path: 'yAxis.reverse',
      name: 'Y轴反向',
      defaultValue: defaultOptions.yAxis.reverse === true,
      category,
    });

    category = ['颜色'];

    builder.addRadio({
      path: `color.mode`,
      name: '模式',
      defaultValue: defaultOptions.color.mode,
      category,
      settings: {
        options: [
          { label: '方案', value: HeatmapColorMode.Scheme },
          { label: '透明度', value: HeatmapColorMode.Opacity },
        ],
      },
    });

    builder.addColorPicker({
      path: `color.fill`,
      name: '颜色',
      defaultValue: defaultOptions.color.fill,
      category,
      showIf: (opts) => opts.color.mode === HeatmapColorMode.Opacity,
    });

    builder.addRadio({
      path: `color.scale`,
      name: '刻度',
      defaultValue: defaultOptions.color.scale,
      category,
      settings: {
        options: [
          { label: '指数', value: HeatmapColorScale.Exponential },
          { label: '线性', value: HeatmapColorScale.Linear },
        ],
      },
      showIf: (opts) => opts.color.mode === HeatmapColorMode.Opacity,
    });

    builder.addSliderInput({
      path: 'color.exponent',
      name: '指数',
      defaultValue: defaultOptions.color.exponent,
      category,
      settings: {
        min: 0.1, // 1 for on/off?
        max: 2,
        step: 0.1,
      },
      showIf: (opts) =>
        opts.color.mode === HeatmapColorMode.Opacity && opts.color.scale === HeatmapColorScale.Exponential,
    });

    builder.addSelect({
      path: `color.scheme`,
      name: '模式',
      description: '',
      defaultValue: defaultOptions.color.scheme,
      category,
      settings: {
        options: colorSchemes.map((scheme) => ({
          value: scheme.name,
          label: scheme.name,
          //description: 'Set a geometry field based on the results of other fields',
        })),
      },
      showIf: (opts) => opts.color.mode !== HeatmapColorMode.Opacity,
    });

    builder
      .addSliderInput({
        path: 'color.steps',
        name: '步数',
        defaultValue: defaultOptions.color.steps,
        category,
        settings: {
          min: 2,
          max: 128,
          step: 1,
        },
      })
      .addBooleanSwitch({
        path: 'color.reverse',
        name: '反向颜色值',
        defaultValue: defaultOptions.color.reverse,
        category,
      })
      .addCustomEditor({
        id: '__scale__',
        path: `__scale__`,
        name: '',
        category,
        editor: () => {
          const palette = quantizeScheme(opts.color, config.theme2);
          return (
            <div>
              <ColorScale colorPalette={palette} min={1} max={100} />
            </div>
          );
        },
      });

    builder
      .addNumberInput({
        path: 'color.min',
        name: '从值开始色阶',
        defaultValue: defaultOptions.color.min,
        settings: {
          placeholder: '自动(最小)',
        },
        category,
      })
      .addNumberInput({
        path: 'color.max',
        name: '值的结束色阶',
        defaultValue: defaultOptions.color.max,
        settings: {
          placeholder: '自动(自动)',
        },
        category,
      });

    category = ['单元格显示'];

    if (!opts.calculate) {
      builder.addTextInput({
        path: 'rowsFrame.value',
        name: '值名称',
        defaultValue: defaultOptions.rowsFrame?.value,
        settings: {
          placeholder: '值',
        },
        category,
      });
    }

    builder
      .addUnitPicker({
        category,
        path: 'cellValues.unit',
        name: '计量单位',
        defaultValue: undefined,
        settings: {
          isClearable: true,
        },
      })
      .addNumberInput({
        category,
        path: 'cellValues.decimals',
        name: '小数',
        settings: {
          placeholder: '自动',
        },
      });

    builder
      // .addRadio({
      //   path: 'showValue',
      //   name: 'Show values',
      //   defaultValue: defaultOptions.showValue,
      //   category,
      //   settings: {
      //     options: [
      //       { value: VisibilityMode.Auto, label: 'Auto' },
      //       { value: VisibilityMode.Always, label: 'Always' },
      //       { value: VisibilityMode.Never, label: 'Never' },
      //     ],
      //   },
      // })
      .addSliderInput({
        name: '单元格间隙',
        path: 'cellGap',
        defaultValue: defaultOptions.cellGap,
        category,
        settings: {
          min: 0,
          max: 25,
        },
      })
      .addNumberInput({
        path: 'filterValues.le',
        name: '隐藏值<=下列值的单元格',
        defaultValue: defaultOptions.filterValues?.le,
        settings: {
          placeholder: '无',
        },
        category,
      })
      .addNumberInput({
        path: 'filterValues.ge',
        name: '隐藏值>=下列值的单元格',
        defaultValue: defaultOptions.filterValues?.ge,
        settings: {
          placeholder: '无',
        },
        category,
      });
    // .addSliderInput({
    //   name: 'Cell radius',
    //   path: 'cellRadius',
    //   defaultValue: defaultOptions.cellRadius,
    //   category,
    //   settings: {
    //     min: 0,
    //     max: 100,
    //   },
    // })

    category = ['提示'];

    builder.addBooleanSwitch({
      path: 'tooltip.show',
      name: '显示提示',
      defaultValue: defaultOptions.tooltip.show,
      category,
    });

    builder.addBooleanSwitch({
      path: 'tooltip.yHistogram',
      name: '显示直方图（Y 轴）',
      defaultValue: defaultOptions.tooltip.yHistogram,
      category,
      showIf: (opts) => opts.tooltip.show,
    });

    category = ['图例'];
    builder.addBooleanSwitch({
      path: 'legend.show',
      name: '显示图例',
      defaultValue: defaultOptions.legend.show,
      category,
    });

    category = ['样本'];
    builder.addColorPicker({
      path: 'exemplars.color',
      name: '颜色',
      defaultValue: defaultOptions.exemplars.color,
      category,
    });
  })
  .setSuggestionsSupplier(new HeatmapSuggestionsSupplier());
