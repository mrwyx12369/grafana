import { css } from '@emotion/css';
import React, { useEffect } from 'react';

import {
  DataTransformerID,
  GrafanaTheme2,
  PanelOptionsEditorBuilder,
  PluginState,
  StandardEditorContext,
  TransformerRegistryItem,
  TransformerUIProps,
  TransformerCategory,
} from '@grafana/data';
import { FrameGeometrySourceMode } from '@grafana/schema';
import { useTheme2 } from '@grafana/ui';
import { addLocationFields } from 'app/features/geo/editor/locationEditor';

import { SpatialCalculation, SpatialOperation, SpatialAction, SpatialTransformOptions } from './models.gen';
import { getDefaultOptions, getTransformerOptionPane } from './optionsHelper';
import { isLineBuilderOption, spatialTransformer } from './spatialTransformer';

// Nothing defined in state
const supplier = (
  builder: PanelOptionsEditorBuilder<SpatialTransformOptions>,
  context: StandardEditorContext<SpatialTransformOptions>
) => {
  const options = context.options ?? {};

  builder.addSelect({
    path: `action`,
    name: 'Action',
    description: '',
    defaultValue: SpatialAction.Prepare,
    settings: {
      options: [
        {
          value: SpatialAction.Prepare,
          label: '准备空间字段',
          description: '根据其他字段的结果设置几何字段',
        },
        {
          value: SpatialAction.Calculate,
          label: '计算值',
          description: '使用几何图形定义新字段（航向/距离/面积）)',
        },
        { value: SpatialAction.Modify, label: '转换', description: '将空间操作应用于几何图形' },
      ],
    },
  });

  if (options.action === SpatialAction.Calculate) {
    builder.addSelect({
      path: `calculate.calc`,
      name: 'Function',
      description: '',
      defaultValue: SpatialCalculation.Heading,
      settings: {
        options: [
          { value: SpatialCalculation.Heading, label: '点' },
          { value: SpatialCalculation.Area, label: '面积' },
          { value: SpatialCalculation.Distance, label: '距离' },
        ],
      },
    });
  } else if (options.action === SpatialAction.Modify) {
    builder.addSelect({
      path: `modify.op`,
      name: 'Operation',
      description: '',
      defaultValue: SpatialOperation.AsLine,
      settings: {
        options: [
          {
            value: SpatialOperation.AsLine,
            label: '作为线',
            description: '创建每行都有一个折点的单线要素',
          },
          {
            value: SpatialOperation.LineBuilder,
            label: '线性构造器',
            description: '在两点之间创建一条线',
          },
        ],
      },
    });
  }

  if (isLineBuilderOption(options)) {
    builder.addNestedOptions({
      category: ['Source'],
      path: 'source',
      build: (b, c) => {
        const loc = options.source ?? {
          mode: FrameGeometrySourceMode.Auto,
        };
        addLocationFields('Point', '', b, loc);
      },
    });

    builder.addNestedOptions({
      category: ['Target'],
      path: 'modify',
      build: (b, c) => {
        const loc = options.modify?.target ?? {
          mode: FrameGeometrySourceMode.Auto,
        };
        addLocationFields('Point', 'target.', b, loc);
      },
    });
  } else {
    addLocationFields('Location', 'source.', builder, options.source);
  }
};

type Props = TransformerUIProps<SpatialTransformOptions>;

export const SetGeometryTransformerEditor = (props: Props) => {
  // a new component is created with every change :(
  useEffect(() => {
    if (!props.options.source?.mode) {
      const opts = getDefaultOptions(supplier);
      props.onChange({ ...opts, ...props.options });
      console.log('geometry useEffect', opts);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const styles = getStyles(useTheme2());

  const pane = getTransformerOptionPane<SpatialTransformOptions>(props, supplier);
  return (
    <div>
      <div>{pane.items.map((v) => v.render())}</div>
      <div>
        {pane.categories.map((c) => {
          return (
            <div key={c.props.id} className={styles.wrap}>
              <h5>{c.props.title}</h5>
              <div className={styles.item}>{c.items.map((s) => s.render())}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  return {
    wrap: css`
      margin-bottom: 20px;
    `,
    item: css`
      border-left: 4px solid ${theme.colors.border.strong};
      padding-left: 10px;
    `,
  };
};

export const spatialTransformRegistryItem: TransformerRegistryItem<SpatialTransformOptions> = {
  id: DataTransformerID.spatial,
  editor: SetGeometryTransformerEditor,
  transformation: spatialTransformer,
  name: spatialTransformer.name,
  description: spatialTransformer.description,
  state: PluginState.alpha,
  categories: new Set([TransformerCategory.PerformSpatialOperations]),
};
