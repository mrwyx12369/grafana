import { isArray, reduce } from 'lodash';

import { IconName } from '@grafana/ui';
import { QueryPart, QueryPartDef } from 'app/features/alerting/state/query_part';

const alertQueryDef = new QueryPartDef({
  type: 'query',
  params: [
    { name: 'queryRefId', type: 'string', dynamicLookup: true },
    {
      name: 'from',
      type: 'string',
      options: ['10s', '1m', '5m', '10m', '15m', '1h', '2h', '6h', '12h', '24h', '48h'],
    },
    { name: 'to', type: 'string', options: ['now', 'now-1m', 'now-5m', 'now-10m', 'now-1h'] },
  ],
  defaultParams: ['#A', '15m', 'now', 'avg'],
});

const conditionTypes = [{ text: '查询y', value: 'query' }];

const alertStateSortScore = {
  alerting: 1,
  firing: 1,
  no_data: 2,
  pending: 3,
  ok: 4,
  paused: 5,
  inactive: 5,
};

export enum EvalFunction {
  'IsAbove' = 'gt',
  'IsBelow' = 'lt',
  'IsOutsideRange' = 'outside_range',
  'IsWithinRange' = 'within_range',
  'HasNoValue' = 'no_value',
}

const evalFunctions = [
  { value: EvalFunction.IsAbove, text: '上界' },
  { value: EvalFunction.IsBelow, text: '下界' },
  { value: EvalFunction.IsOutsideRange, text: '超出范围' },
  { value: EvalFunction.IsWithinRange, text: '在范围内' },
  { value: EvalFunction.HasNoValue, text: '无数值' },
];

const evalOperators = [
  { text: '或', value: 'or' },
  { text: '与', value: 'and' },
];

const reducerTypes = [
  { text: 'avg()', value: 'avg' },
  { text: 'min()', value: 'min' },
  { text: 'max()', value: 'max' },
  { text: 'sum()', value: 'sum' },
  { text: 'count()', value: 'count' },
  { text: 'last()', value: 'last' },
  { text: 'median()', value: 'median' },
  { text: 'diff()', value: 'diff' },
  { text: 'diff_abs()', value: 'diff_abs' },
  { text: 'percent_diff()', value: 'percent_diff' },
  { text: 'percent_diff_abs()', value: 'percent_diff_abs' },
  { text: 'count_non_null()', value: 'count_non_null' },
] as const;

const noDataModes = [
  { text: '报警', value: 'alerting' },
  { text: '无数据', value: 'no_data' },
  { text: '保持上一个状态', value: 'keep_state' },
  { text: '良好', value: 'ok' },
];

const executionErrorModes = [
  { text: '警报', value: 'alerting' },
  { text: '保持上一个状态', value: 'keep_state' },
];

function createReducerPart(model: any) {
  const def = new QueryPartDef({ type: model.type, defaultParams: [] });
  return new QueryPart(model, def);
}

// state can also contain a "Reason", ie. "Alerting (NoData)" which indicates that the actual state is "Alerting" but
// the reason it is set to "Alerting" is "NoData"; a lack of data points to evaluate.
export function normalizeAlertState(state: string) {
  return state.toLowerCase().replace(/_/g, '').split(' ')[0];
}

interface AlertStateDisplayModel {
  text: string;
  iconClass: IconName;
  stateClass: string;
}

function getStateDisplayModel(state: string): AlertStateDisplayModel {
  const normalizedState = normalizeAlertState(state);

  switch (normalizedState) {
    case 'normal':
    case 'ok': {
      return {
        text: '良好',
        iconClass: 'heart',
        stateClass: 'alert-state-ok',
      };
    }
    case 'alerting': {
      return {
        text: '报警',
        iconClass: 'heart-break',
        stateClass: 'alert-state-critical',
      };
    }
    case 'nodata': {
      return {
        text: '无数据',
        iconClass: 'question-circle',
        stateClass: 'alert-state-warning',
      };
    }
    case 'paused': {
      return {
        text: '暂停',
        iconClass: 'pause',
        stateClass: 'alert-state-paused',
      };
    }
    case 'pending': {
      return {
        text: '等待',
        iconClass: 'hourglass',
        stateClass: 'alert-state-warning',
      };
    }

    case 'firing': {
      return {
        text: '触发',
        iconClass: 'fire',
        stateClass: '',
      };
    }

    case 'inactive': {
      return {
        text: '非活动',
        iconClass: 'check',
        stateClass: '',
      };
    }

    case 'error': {
      return {
        text: '错误',
        iconClass: 'heart-break',
        stateClass: 'alert-state-critical',
      };
    }

    case 'unknown':
    default: {
      return {
        text: '未知',
        iconClass: 'question-circle',
        stateClass: '.alert-state-paused',
      };
    }
  }
}

function joinEvalMatches(matches: any, separator: string) {
  return reduce(
    matches,
    (res, ev) => {
      if (ev.metric !== undefined && ev.value !== undefined) {
        res.push(ev.metric + '=' + ev.value);
      }

      // For backwards compatibility . Should be be able to remove this after ~2017-06-01
      if (ev.Metric !== undefined && ev.Value !== undefined) {
        res.push(ev.Metric + '=' + ev.Value);
      }

      return res;
    },
    [] as string[]
  ).join(separator);
}

function getAlertAnnotationInfo(ah: any) {
  // backward compatibility, can be removed in grafana 5.x
  // old way stored evalMatches in data property directly,
  // new way stores it in evalMatches property on new data object

  if (isArray(ah.data)) {
    return joinEvalMatches(ah.data, ', ');
  } else if (isArray(ah.data.evalMatches)) {
    return joinEvalMatches(ah.data.evalMatches, ', ');
  }

  if (ah.data.error) {
    return 'Error: ' + ah.data.error;
  }

  return '';
}

export default {
  alertQueryDef: alertQueryDef,
  getStateDisplayModel: getStateDisplayModel,
  conditionTypes: conditionTypes,
  evalFunctions: evalFunctions,
  evalOperators: evalOperators,
  noDataModes: noDataModes,
  executionErrorModes: executionErrorModes,
  reducerTypes: reducerTypes,
  createReducerPart: createReducerPart,
  getAlertAnnotationInfo: getAlertAnnotationInfo,
  alertStateSortScore: alertStateSortScore,
};
