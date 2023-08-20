import { css } from '@emotion/css';
import React, { ReactElement } from 'react';
import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd';

import { selectors } from '@grafana/e2e-selectors';
import { Stack } from '@grafana/experimental';
import { reportInteraction } from '@grafana/runtime';
import { Button, useStyles2 } from '@grafana/ui';
import EmptyListCTA from 'app/core/components/EmptyListCTA/EmptyListCTA';

import { VariablesDependenciesButton } from '../inspect/VariablesDependenciesButton';
import { UsagesToNetwork, VariableUsageTree } from '../inspect/utils';
import { KeyedVariableIdentifier } from '../state/types';
import { VariableModel } from '../types';

import { VariableEditorListRow } from './VariableEditorListRow';

export interface Props {
  variables: VariableModel[];
  usages: VariableUsageTree[];
  usagesNetwork: UsagesToNetwork[];
  onAdd: () => void;
  onEdit: (identifier: KeyedVariableIdentifier) => void;
  onChangeOrder: (identifier: KeyedVariableIdentifier, fromIndex: number, toIndex: number) => void;
  onDuplicate: (identifier: KeyedVariableIdentifier) => void;
  onDelete: (identifier: KeyedVariableIdentifier) => void;
}

export function VariableEditorList({
  variables,
  usages,
  usagesNetwork,
  onChangeOrder,
  onAdd,
  onEdit,
  onDelete,
  onDuplicate,
}: Props): ReactElement {
  const styles = useStyles2(getStyles);
  const onDragEnd = (result: DropResult) => {
    if (!result.destination || !result.source) {
      return;
    }
    reportInteraction('Variable drag and drop');
    const identifier = JSON.parse(result.draggableId);
    onChangeOrder(identifier, variables[result.source.index].index, variables[result.destination.index].index);
  };

  return (
    <div>
      <div>
        {variables.length === 0 && <EmptyVariablesList onAdd={onAdd} />}

        {variables.length > 0 && (
          <Stack direction="column" gap={4}>
            <div className={styles.tableContainer}>
              <table
                className="filter-table filter-table--hover"
                aria-label={selectors.pages.Dashboard.Settings.Variables.List.table}
                role="grid"
              >
                <thead>
                  <tr>
                    <th>变量</th>
                    <th>定义</th>
                    <th colSpan={5} />
                  </tr>
                </thead>
                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="variables-list" direction="vertical">
                    {(provided) => (
                      <tbody ref={provided.innerRef} {...provided.droppableProps}>
                        {variables.map((variable, index) => (
                          <VariableEditorListRow
                            index={index}
                            key={`${variable.name}-${index}`}
                            variable={variable}
                            usageTree={usages}
                            usagesNetwork={usagesNetwork}
                            onDelete={onDelete}
                            onDuplicate={onDuplicate}
                            onEdit={onEdit}
                          />
                        ))}
                        {provided.placeholder}
                      </tbody>
                    )}
                  </Droppable>
                </DragDropContext>
              </table>
            </div>
            <Stack>
              <VariablesDependenciesButton variables={variables} />
              <Button
                aria-label={selectors.pages.Dashboard.Settings.Variables.List.newButton}
                onClick={onAdd}
                icon="plus"
              >
                新增变量
              </Button>
            </Stack>
          </Stack>
        )}
      </div>
    </div>
  );
}

function EmptyVariablesList({ onAdd }: { onAdd: () => void }): ReactElement {
  return (
    <div>
      <EmptyListCTA
        title="还没有变量"
        buttonIcon="calculator-alt"
        buttonTitle="添加变量"
        infoBox={{
          __html: ` <p>
                  变量可实现更具交互性和动态性的仪表板。而不是像服务器这样硬编码的东西或指标查询中的传感器名称，可以在其位置使用变量。变量显示为
                  仪表板顶部的列表框。这些下拉列表使更改数据变得容易显示在仪表板中。查看
                    <a class="external-link" href="https://www.smxyi,com/docs/datav/latest/variables/" target="_blank">
                      模板和变量文档
                    </a>
                    获取详细信息.
                  </p>`,
        }}
        infoBoxTitle="变量有什么作用？"
        onClick={(event) => {
          event.preventDefault();
          onAdd();
        }}
      />
    </div>
  );
}

const getStyles = () => ({
  tableContainer: css`
    overflow: scroll;
    width: 100%;
  `,
});
