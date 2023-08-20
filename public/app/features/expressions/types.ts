import { DataQuery, ReducerID, SelectableValue } from '@grafana/data';

import { EvalFunction } from '../alerting/state/alertDef';

/**
 * MATCHES a constant in DataSourceWithBackend
 */
export const ExpressionDatasourceUID = '__expr__';

export enum ExpressionQueryType {
  math = 'math',
  reduce = 'reduce',
  resample = 'resample',
  classic = 'classic_conditions',
  threshold = 'threshold',
}

export const getExpressionLabel = (type: ExpressionQueryType) => {
  switch (type) {
    case ExpressionQueryType.math:
      return '数学函数';
    case ExpressionQueryType.reduce:
      return 'Reduce函数';
    case ExpressionQueryType.resample:
      return '重新抽样';
    case ExpressionQueryType.classic:
      return '经典条件';
    case ExpressionQueryType.threshold:
      return '阀值';
  }
};

export const expressionTypes: Array<SelectableValue<ExpressionQueryType>> = [
  {
    value: ExpressionQueryType.math,
    label: '数学公式',
    description: '时间序列或数字数据上的自由格式数学公式。',
  },
  {
    value: ExpressionQueryType.reduce,
    label: 'Reduce函数',
    description:
      '获取从查询或表达式返回的一个或多个时序，并将每个时序转换为单个数字。',
  },
  {
    value: ExpressionQueryType.resample,
    label: '重新抽样',
    description: '更改每个时序中的时间戳以具有一致的时间间隔。',
  },
  {
    value: ExpressionQueryType.classic,
    label: '经典条件',
    description: '获取从查询或表达式返回的一个或多个时序，并检查是否有任何序列与条件匹配。禁用此规则的多维警报。',
  },
  {
    value: ExpressionQueryType.threshold,
    label: '阈值',
    description: '获取从查询或表达式返回的一个或多个时序，并检查是否有任何序列与阈值条件匹配。',
  },
];

export const reducerTypes: Array<SelectableValue<string>> = [
  { value: ReducerID.min, label: '最小', description: '获取最小值' },
  { value: ReducerID.max, label: '最大', description: '获取最大值' },
  { value: ReducerID.mean, label: '平均', description: '获取平均值' },
  { value: ReducerID.sum, label: '合计', description: '获取合计值' },
  { value: ReducerID.count, label: '计数', description: '获取值的数量' },
  { value: ReducerID.last, label: '最后值', description: '获取最后一个值' },
];

export enum ReducerMode {
  Strict = '', // backend API wants an empty string to support "strict" mode
  ReplaceNonNumbers = 'replaceNN',
  DropNonNumbers = 'dropNN',
}

export const reducerModes: Array<SelectableValue<ReducerMode>> = [
  {
    value: ReducerMode.Strict,
    label: '严格',
    description: '如果序列包含非数字数据，则结果可以是 NaN',
  },
  {
    value: ReducerMode.DropNonNumbers,
    label: '删除非数值',
    description: '在减少之前从输入序列中删除 NaN、+/-Inf 和零',
  },
  {
    value: ReducerMode.ReplaceNonNumbers,
    label: '替换非数值',
    description: '在减少之前将 NaN、+/-Inf 和 null 替换为常量值',
  },
];

export const downsamplingTypes: Array<SelectableValue<string>> = [
  { value: ReducerID.last, label: '最后值', description: '用最后一个值填充' },
  { value: ReducerID.min, label: '最小', description: '填充最小值' },
  { value: ReducerID.max, label: '最大', description: '用最大值填充' },
  { value: ReducerID.mean, label: '平均', description: '填充平均值' },
  { value: ReducerID.sum, label: '合计', description: '填充所有值的总和' },
];

export const upsamplingTypes: Array<SelectableValue<string>> = [
  { value: 'pad', label: '最后一个已值填充', description: '填充最后一个已知值' },
  { value: 'backfilling', label: '下一个已知值回填', description: '填充下一个已知值' },
  { value: 'fillna', label: '采用NaN(空值)填充NaN ', description: '填充NaN' },
];

export const thresholdFunctions: Array<SelectableValue<EvalFunction>> = [
  { value: EvalFunction.IsAbove, label: '以上' },
  { value: EvalFunction.IsBelow, label: '以下' },
  { value: EvalFunction.IsWithinRange, label: '范围之内' },
  { value: EvalFunction.IsOutsideRange, label: '越界' },
];

/**
 * For now this is a single object to cover all the types.... would likely
 * want to split this up by type as the complexity increases
 */
export interface ExpressionQuery extends DataQuery {
  type: ExpressionQueryType;
  reducer?: string;
  expression?: string;
  window?: string;
  downsampler?: string;
  upsampler?: string;
  conditions?: ClassicCondition[];
  settings?: ExpressionQuerySettings;
}

export interface ExpressionQuerySettings {
  mode?: ReducerMode;
  replaceWithValue?: number;
}

export interface ClassicCondition {
  evaluator: {
    params: number[];
    type: EvalFunction;
  };
  operator?: {
    type: string;
  };
  query: {
    params: string[];
  };
  reducer: {
    params: [];
    type: ReducerType;
  };
  type: 'query';
}

export type ReducerType =
  | 'avg'
  | 'min'
  | 'max'
  | 'sum'
  | 'count'
  | 'last'
  | 'median'
  | 'diff'
  | 'diff_abs'
  | 'percent_diff'
  | 'percent_diff_abs'
  | 'count_non_null';
