import {
  Field,
  FieldType,
  getFieldDisplayName,
  PanelOptionsEditorBuilder,
  PanelPlugin,
  SelectableValue,
} from '@grafana/data';
import { config } from '@grafana/runtime';
import { GraphFieldConfig } from '@grafana/schema';
import { commonOptionsBuilder } from '@grafana/ui';

import { defaultGraphConfig, getGraphFieldConfig } from '../timeseries/config';

import { CandlestickPanel } from './CandlestickPanel';
import { CandlestickData, candlestickFieldsInfo, FieldPickerInfo, prepareCandlestickFields } from './fields';
import { CandlestickSuggestionsSupplier } from './suggestions';
import { defaultCandlestickColors, defaultOptions, Options, VizDisplayMode, ColorStrategy, CandleStyle } from './types';

const modeOptions = [
  { label: '蜡烛', value: VizDisplayMode.Candles },
  { label: '容量', value: VizDisplayMode.Volume },
  { label: '两者', value: VizDisplayMode.CandlesVolume },
] as Array<SelectableValue<VizDisplayMode>>;

const candleStyles = [
  { label: '蜡烛', value: CandleStyle.Candles },
  { label: 'OHLC条', value: CandleStyle.OHLCBars },
] as Array<SelectableValue<CandleStyle>>;

const colorStrategies = [
  { label: '自开放盘来', value: ColorStrategy.OpenClose },
  { label: '自上次收盘以来', value: ColorStrategy.CloseClose },
] as Array<SelectableValue<ColorStrategy>>;

const numericFieldFilter = (f: Field) => f.type === FieldType.number;

function addFieldPicker(
  builder: PanelOptionsEditorBuilder<Options>,
  info: FieldPickerInfo,
  data: CandlestickData | null
) {
  let placeholderText = '自动 ';

  if (data) {
    const current = data[info.key] as Field;

    if (current?.config) {
      placeholderText += '= ' + getFieldDisplayName(current);

      if (current === data?.open && info.key !== 'open') {
        placeholderText += ` (${info.defaults.join(',')})`;
      }
    } else {
      placeholderText += `(${info.defaults.join(',')})`;
    }
  }

  builder.addFieldNamePicker({
    path: `fields.${info.key}`,
    name: info.name,
    description: info.description,
    settings: {
      filter: numericFieldFilter,
      placeholderText,
    },
  });
}

export const plugin = new PanelPlugin<Options, GraphFieldConfig>(CandlestickPanel)
  .useFieldConfig(getGraphFieldConfig(defaultGraphConfig))
  .setPanelOptions((builder, context) => {
    const opts = context.options ?? defaultOptions;
    const info = prepareCandlestickFields(context.data, opts, config.theme2);

    builder
      .addRadio({
        path: 'mode',
        name: '模式',
        description: '',
        defaultValue: defaultOptions.mode,
        settings: {
          options: modeOptions,
        },
      })
      .addRadio({
        path: 'candleStyle',
        name: '蜡烛样式',
        description: '',
        defaultValue: defaultOptions.candleStyle,
        settings: {
          options: candleStyles,
        },
        showIf: (opts) => opts.mode !== VizDisplayMode.Volume,
      })
      .addRadio({
        path: 'colorStrategy',
        name: '色彩策略',
        description: '',
        defaultValue: defaultOptions.colorStrategy,
        settings: {
          options: colorStrategies,
        },
      })
      .addColorPicker({
        path: 'colors.up',
        name: '往上颜色',
        defaultValue: defaultCandlestickColors.up,
      })
      .addColorPicker({
        path: 'colors.down',
        name: '往下颜色',
        defaultValue: defaultCandlestickColors.down,
      });

    addFieldPicker(builder, candlestickFieldsInfo.open, info);
    if (opts.mode !== VizDisplayMode.Volume) {
      addFieldPicker(builder, candlestickFieldsInfo.high, info);
      addFieldPicker(builder, candlestickFieldsInfo.low, info);
    }
    addFieldPicker(builder, candlestickFieldsInfo.close, info);

    if (opts.mode !== VizDisplayMode.Candles) {
      addFieldPicker(builder, candlestickFieldsInfo.volume, info);
    }

    builder.addRadio({
      path: 'includeAllFields',
      name: '其他字段',
      description: '使用标准时间序列选项配置上面未映射的任何字段',
      defaultValue: defaultOptions.includeAllFields,
      settings: {
        options: [
          { label: '忽略', value: false },
          { label: '包括', value: true },
        ],
      },
    });

    // commonOptionsBuilder.addTooltipOptions(builder);
    commonOptionsBuilder.addLegendOptions(builder);
  })
  .setDataSupport({ annotations: true, alertStates: true })
  .setSuggestionsSupplier(new CandlestickSuggestionsSupplier());
