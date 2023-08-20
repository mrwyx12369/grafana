import { metricAggregationConfig, pipelineOptions } from './components/QueryEditor/MetricAggregationsEditor/utils';
import {
  ElasticsearchQuery,
  ExtendedStat,
  MetricAggregation,
  MovingAverageModelOption,
  MetricAggregationType,
  DateHistogram,
} from './types';

export const extendedStats: ExtendedStat[] = [
  { label: '平均数', value: 'avg' },
  { label: '组小数', value: 'min' },
  { label: '最大数', value: 'max' },
  { label: '合计数', value: 'sum' },
  { label: '总数', value: 'count' },
  { label: '标准方差', value: 'std_deviation' },
  { label: '标准方差上界', value: 'std_deviation_bounds_upper' },
  { label: '标准方差下界', value: 'std_deviation_bounds_lower' },
];

export const movingAvgModelOptions: MovingAverageModelOption[] = [
  { label: '简单平均', value: 'simple' },
  { label: '线性平均', value: 'linear' },
  { label: '指数加权平均', value: 'ewma' },
  { label: '霍尔特线性趋势', value: 'holt' },
  { label: '三次指数平滑', value: 'holt_winters' },
];

export const highlightTags = {
  pre: '@HIGHLIGHT@',
  post: '@/HIGHLIGHT@',
};

export function defaultMetricAgg(id = '1'): MetricAggregation {
  return { type: 'count', id };
}

export function defaultBucketAgg(id = '1'): DateHistogram {
  return { type: 'date_histogram', id, settings: { interval: 'auto' } };
}

export const findMetricById = (metrics: MetricAggregation[], id: MetricAggregation['id']) =>
  metrics.find((metric) => metric.id === id);

export function hasMetricOfType(target: ElasticsearchQuery, type: MetricAggregationType): boolean {
  return !!target?.metrics?.some((m) => m.type === type);
}

// Even if we have type guards when building a query, we currently have no way of getting this information from the response.
// We should try to find a better (type safe) way of doing the following 2.
export function isPipelineAgg(metricType: MetricAggregationType) {
  return metricType in pipelineOptions;
}

export function isPipelineAggWithMultipleBucketPaths(metricType: MetricAggregationType) {
  return !!metricAggregationConfig[metricType].supportsMultipleBucketPaths;
}
