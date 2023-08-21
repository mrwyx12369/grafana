import React from 'react';

import { PanelPlugin } from '@grafana/data';
import { config } from '@grafana/runtime';
import { commonOptionsBuilder } from '@grafana/ui';

import { GeomapPanel } from './GeomapPanel';
import { LayersEditor } from './editor/LayersEditor';
import { MapViewEditor } from './editor/MapViewEditor';
import { getLayerEditor } from './editor/layerEditor';
import { mapPanelChangedHandler, mapMigrationHandler } from './migrations';
import { defaultMapViewConfig, Options, TooltipMode, GeomapInstanceState } from './types';

export const plugin = new PanelPlugin<Options>(GeomapPanel)
  .setNoPadding()
  .setPanelChangeHandler(mapPanelChangedHandler)
  .setMigrationHandler(mapMigrationHandler)
  .useFieldConfig({
    useCustomConfig: (builder) => {
      commonOptionsBuilder.addHideFrom(builder);
    },
  })
  .setPanelOptions((builder, context) => {
    let category = ['地图视图'];
    builder.addCustomEditor({
      category,
      id: 'view',
      path: 'view',
      name: '初始视图', // don't show it
      description: '此位置将显示面板首次加载的时间。',
      editor: MapViewEditor,
      defaultValue: defaultMapViewConfig,
    });

    builder.addBooleanSwitch({
      category,
      path: 'view.shared',
      description: '在多个面板上使用相同的视图。 注意：这可能需要重新加载仪表板。',
      name: '共享视图',
      defaultValue: defaultMapViewConfig.shared,
    });

    // eslint-disable-next-line
    const state = context.instanceState as GeomapInstanceState;
    if (!state?.layers) {
      // TODO? show spinner?
    } else {
      const layersCategory = ['地图图层'];
      const basemapCategory = ['底图图层'];
      builder.addCustomEditor({
        category: layersCategory,
        id: 'layers',
        path: '',
        name: '',
        editor: LayersEditor,
      });

      const selected = state.layers[state.selected];
      if (state.selected && selected) {
        builder.addNestedOptions(
          getLayerEditor({
            state: selected,
            category: layersCategory,
            basemaps: false,
          })
        );
      }

      const baselayer = state.layers[0];
      if (config.geomapDisableCustomBaseLayer) {
        builder.addCustomEditor({
          category: basemapCategory,
          id: 'layers',
          path: '',
          name: '',
          // eslint-disable-next-line react/display-name
          editor: () => <div>The basemap layer is configured by the server admin.</div>,
        });
      } else if (baselayer) {
        builder.addNestedOptions(
          getLayerEditor({
            state: baselayer,
            category: basemapCategory,
            basemaps: true,
          })
        );
      }
    }

    // The controls section
    category = ['地图控件'];
    builder
      .addBooleanSwitch({
        category,
        path: 'controls.showZoom',
        description: '在左上角显示缩放控制按钮',
        name: '显示缩放控件',
        defaultValue: true,
      })
      .addBooleanSwitch({
        category,
        path: 'controls.mouseWheelZoom',
        description: '通过鼠标滚轮启用缩放控制',
        name: '鼠标滚轮缩放',
        defaultValue: true,
      })
      .addBooleanSwitch({
        category,
        path: 'controls.showAttribution',
        name: '显示归属',
        description: '在右下角显示地图来源属性信息',
        defaultValue: true,
      })
      .addBooleanSwitch({
        category,
        path: 'controls.showScale',
        name: '显示比例',
        description: '指示地图比例',
        defaultValue: false,
      })
      .addBooleanSwitch({
        category,
        path: 'controls.showMeasure',
        name: '显示测量工具',
        description: '显示用于在地图上进行测量的工具',
        defaultValue: false,
      })
      .addBooleanSwitch({
        category,
        path: 'controls.showDebug',
        name: '显示调试',
        description: '显示地图信息',
        defaultValue: false,
      })
      .addRadio({
        category,
        path: 'tooltip.mode',
        name: '提示',
        defaultValue: TooltipMode.Details,
        settings: {
          options: [
            { label: '无', value: TooltipMode.None, description: '单击时显示内容，而不是悬停' },
            { label: '详细', value: TooltipMode.Details, description: '悬停时显示弹出窗口' },
          ],
        },
      });
  });
