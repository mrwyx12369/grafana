import { useMemo } from 'react';

import { DataFrame, getFieldDisplayName, TransformerCategory } from '@grafana/data';

export function useAllFieldNamesFromDataFrames(input: DataFrame[]): string[] {
  return useMemo(() => {
    if (!Array.isArray(input)) {
      return [];
    }

    return Object.keys(
      input.reduce<Record<string, boolean>>((names, frame) => {
        if (!frame || !Array.isArray(frame.fields)) {
          return names;
        }

        return frame.fields.reduce((names, field) => {
          const t = getFieldDisplayName(field, frame, input);
          names[t] = true;
          return names;
        }, names);
      }, {})
    );
  }, [input]);
}

export function getDistinctLabels(input: DataFrame[]): Set<string> {
  const distinct = new Set<string>();
  for (const frame of input) {
    for (const field of frame.fields) {
      if (field.labels) {
        for (const k of Object.keys(field.labels)) {
          distinct.add(k);
        }
      }
    }
  }
  return distinct;
}

export const categoriesLabels: { [K in TransformerCategory]: string } = {
  combine: '组合',
  calculateNewFields: '计算新字段',
  createNewVisualization: '创建新的可视化',
  filter: '过滤',
  performSpatialOperations: '执行空间操作',
  reformat: '重新格式化',
  reorderAndRename: '重新排序和重命名',
};
