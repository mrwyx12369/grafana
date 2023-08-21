import { FieldConfigProperty, PanelOptionsEditorBuilder, PanelPlugin } from '@grafana/data';
import { FrameState } from 'app/features/canvas/runtime/frame';

import { CanvasPanel, InstanceState } from './CanvasPanel';
import { getConnectionEditor } from './editor/connectionEditor';
import { getElementEditor } from './editor/element/elementEditor';
import { getLayerEditor } from './editor/layer/layerEditor';
import { canvasMigrationHandler } from './migrations';
import { Options } from './panelcfg.gen';

export const addStandardCanvasEditorOptions = (builder: PanelOptionsEditorBuilder<Options>) => {
  builder.addBooleanSwitch({
    path: 'inlineEditing',
    name: '内联编辑',
    description: '启用直接编辑面板',
    defaultValue: true,
  });

  builder.addBooleanSwitch({
    path: 'showAdvancedTypes',
    name: '实验元素类型',
    description: '启用实验元素类型的选择',
    defaultValue: true,
  });
};

export const plugin = new PanelPlugin<Options>(CanvasPanel)
  .setNoPadding() // extend to panel edges
  .useFieldConfig({
    standardOptions: {
      [FieldConfigProperty.Mappings]: {
        settings: {
          icon: true,
        },
      },
    },
  })
  .setMigrationHandler(canvasMigrationHandler)
  .setPanelOptions((builder, context) => {
    const state: InstanceState = context.instanceState;

    addStandardCanvasEditorOptions(builder);

    if (state) {
      builder.addNestedOptions(getLayerEditor(state));

      const selection = state.selected;
      const connectionSelection = state.selectedConnection;

      if (selection?.length === 1) {
        const element = selection[0];
        if (!(element instanceof FrameState)) {
          builder.addNestedOptions(
            getElementEditor({
              category: [`所选元素 (${element.options.name})`],
              element,
              scene: state.scene,
            })
          );
        }
      }

      if (connectionSelection) {
        builder.addNestedOptions(
          getConnectionEditor({
            category: ['选定的连接'],
            connection: connectionSelection,
            scene: state.scene,
          })
        );
      }
    }
  });
