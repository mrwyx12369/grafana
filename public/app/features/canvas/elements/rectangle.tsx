import { css } from '@emotion/css';
import React, { PureComponent } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { stylesFactory } from '@grafana/ui';
import { config } from 'app/core/config';
import { DimensionContext } from 'app/features/dimensions/context';
import { ColorDimensionEditor } from 'app/features/dimensions/editors/ColorDimensionEditor';
import { TextDimensionEditor } from 'app/features/dimensions/editors/TextDimensionEditor';

import { CanvasElementItem, CanvasElementProps, defaultBgColor, defaultTextColor } from '../element';
import { Align, TextConfig, TextData, VAlign } from '../types';

class RectangleDisplay extends PureComponent<CanvasElementProps<TextConfig, TextData>> {
  render() {
    const { data } = this.props;
    const styles = getStyles(config.theme2, data);
    return (
      <div className={styles.container}>
        <span className={styles.span}>{data?.text}</span>
      </div>
    );
  }
}
const getStyles = stylesFactory((theme: GrafanaTheme2, data) => ({
  container: css`
    position: absolute;
    height: 100%;
    width: 100%;
    display: table;
  `,
  span: css`
    display: table-cell;
    vertical-align: ${data?.valign};
    text-align: ${data?.align};
    font-size: ${data?.size}px;
    color: ${data?.color};
  `,
}));
export const rectangleItem: CanvasElementItem<TextConfig, TextData> = {
  id: 'rectangle',
  name: '矩形图',
  description: '矩形图',

  display: RectangleDisplay,

  defaultSize: {
    width: 240,
    height: 160,
  },

  getNewOptions: (options) => ({
    ...options,
    config: {
      align: Align.Center,
      valign: VAlign.Middle,
      color: {
        fixed: defaultTextColor,
      },
    },
    background: {
      color: {
        fixed: defaultBgColor,
      },
    },
  }),

  // Called when data changes
  prepareData: (ctx: DimensionContext, cfg: TextConfig) => {
    const data: TextData = {
      text: cfg.text ? ctx.getText(cfg.text).value() : '',
      align: cfg.align ?? Align.Center,
      valign: cfg.valign ?? VAlign.Middle,
      size: cfg.size,
    };

    if (cfg.color) {
      data.color = ctx.getColor(cfg.color).value();
    }

    return data;
  },

  // Heatmap overlay options
  registerOptionsUI: (builder) => {
    const category = ['矩形图'];
    builder
      .addCustomEditor({
        category,
        id: 'textSelector',
        path: 'config.text',
        name: '文本',
        editor: TextDimensionEditor,
      })
      .addCustomEditor({
        category,
        id: 'config.color',
        path: 'config.color',
        name: '文本颜色',
        editor: ColorDimensionEditor,
        settings: {},
        defaultValue: {},
      })
      .addRadio({
        category,
        path: 'config.align',
        name: '文本对齐',
        settings: {
          options: [
            { value: Align.Left, label: '左对齐' },
            { value: Align.Center, label: '居中' },
            { value: Align.Right, label: '右对齐' },
          ],
        },
        defaultValue: Align.Left,
      })
      .addRadio({
        category,
        path: 'config.valign',
        name: '垂直对齐',
        settings: {
          options: [
            { value: VAlign.Top, label: '顶部对齐' },
            { value: VAlign.Middle, label: '中间对齐' },
            { value: VAlign.Bottom, label: '底部对齐' },
          ],
        },
        defaultValue: VAlign.Middle,
      })
      .addNumberInput({
        category,
        path: 'config.size',
        name: '文本大小',
        settings: {
          placeholder: '自动',
        },
      });
  },
};
