import { css, cx } from '@emotion/css';
import { dump } from 'js-yaml';
import { keyBy, startCase } from 'lodash';
import React from 'react';

import { DataSourceInstanceSettings, GrafanaTheme2, PanelData, RelativeTimeRange } from '@grafana/data';
import { Stack } from '@grafana/experimental';
import { config } from '@grafana/runtime';
import { Badge, useStyles2 } from '@grafana/ui';
import { mapRelativeTimeRangeToOption } from '@grafana/ui/src/components/DateTimePickers/RelativeTimeRangePicker/utils';

import { AlertQuery } from '../../../types/unified-alerting-dto';
import { isExpressionQuery } from '../../expressions/guards';
import {
  downsamplingTypes,
  ExpressionQuery,
  ExpressionQueryType,
  reducerModes,
  ReducerMode,
  reducerTypes,
  thresholdFunctions,
  upsamplingTypes,
} from '../../expressions/types';
import alertDef, { EvalFunction } from '../state/alertDef';

import { ExpressionResult } from './components/expressions/Expression';
import { getThresholdsForQueries, ThresholdDefinition } from './components/rule-editor/util';
import { RuleViewerVisualization } from './components/rule-viewer/RuleViewerVisualization';

interface GrafanaRuleViewerProps {
  queries: AlertQuery[];
  condition: string;
  evalDataByQuery?: Record<string, PanelData>;
  evalTimeRanges?: Record<string, RelativeTimeRange>;
  onTimeRangeChange: (queryRef: string, timeRange: RelativeTimeRange) => void;
}

export function GrafanaRuleQueryViewer({
  queries,
  condition,
  evalDataByQuery = {},
  evalTimeRanges = {},
  onTimeRangeChange,
}: GrafanaRuleViewerProps) {
  const dsByUid = keyBy(Object.values(config.datasources), (ds) => ds.uid);
  const dataQueries = queries.filter((q) => !isExpressionQuery(q.model));
  const expressions = queries.filter((q) => isExpressionQuery(q.model));
  const styles = useStyles2(getExpressionViewerStyles);

  const thresholds = getThresholdsForQueries(queries);

  return (
    <Stack gap={2} direction="column">
      <div className={styles.maxWidthContainer}>
        <Stack gap={2}>
          {dataQueries.map(({ model, relativeTimeRange, refId, datasourceUid }, index) => {
            const dataSource = dsByUid[datasourceUid];

            return (
              <QueryPreview
                key={index}
                refId={refId}
                isAlertCondition={condition === refId}
                model={model}
                relativeTimeRange={relativeTimeRange}
                evalTimeRange={evalTimeRanges[refId]}
                dataSource={dataSource}
                thresholds={thresholds[refId]}
                queryData={evalDataByQuery[refId]}
                onEvalTimeRangeChange={(timeRange) => onTimeRangeChange(refId, timeRange)}
              />
            );
          })}
        </Stack>
      </div>
      <div className={styles.maxWidthContainer}>
        <Stack gap={1}>
          {expressions.map(({ model, refId, datasourceUid }, index) => {
            const dataSource = dsByUid[datasourceUid];

            return (
              isExpressionQuery(model) && (
                <ExpressionPreview
                  key={index}
                  refId={refId}
                  isAlertCondition={condition === refId}
                  model={model}
                  dataSource={dataSource}
                  evalData={evalDataByQuery[refId]}
                />
              )
            );
          })}
        </Stack>
      </div>
    </Stack>
  );
}

interface QueryPreviewProps extends Pick<AlertQuery, 'refId' | 'relativeTimeRange' | 'model'> {
  isAlertCondition: boolean;
  dataSource?: DataSourceInstanceSettings;
  queryData?: PanelData;
  thresholds?: ThresholdDefinition;
  evalTimeRange?: RelativeTimeRange;
  onEvalTimeRangeChange: (timeRange: RelativeTimeRange) => void;
}

export function QueryPreview({
  refId,
  relativeTimeRange,
  thresholds,
  model,
  dataSource,
  queryData,
  evalTimeRange,
  onEvalTimeRangeChange,
}: QueryPreviewProps) {
  const styles = useStyles2(getQueryPreviewStyles);

  // relativeTimeRange is what is defined for a query
  // evalTimeRange is temporary value which the user can change
  const headerItems = [dataSource?.name ?? '[[Data source not found]]'];
  if (relativeTimeRange) {
    headerItems.push(mapRelativeTimeRangeToOption(relativeTimeRange).display);
  }

  return (
    <QueryBox refId={refId} headerItems={headerItems} className={styles.contentBox}>
      <pre className={styles.code}>
        <code>{dump(model)}</code>
      </pre>
      {dataSource && (
        <RuleViewerVisualization
          refId={refId}
          dsSettings={dataSource}
          model={model}
          data={queryData}
          thresholds={thresholds}
          relativeTimeRange={evalTimeRange}
          onTimeRangeChange={onEvalTimeRangeChange}
          className={styles.visualization}
        />
      )}
    </QueryBox>
  );
}

const getQueryPreviewStyles = (theme: GrafanaTheme2) => ({
  code: css`
    margin: ${theme.spacing(1)};
  `,
  contentBox: css`
    flex: 1 0 100%;
  `,
  visualization: css`
    padding: ${theme.spacing(1)};
  `,
});

interface ExpressionPreviewProps extends Pick<AlertQuery, 'refId'> {
  isAlertCondition: boolean;
  model: ExpressionQuery;
  dataSource: DataSourceInstanceSettings;
  evalData?: PanelData;
}

function ExpressionPreview({ refId, model, evalData, isAlertCondition }: ExpressionPreviewProps) {
  function renderPreview() {
    switch (model.type) {
      case ExpressionQueryType.math:
        return <MathExpressionViewer model={model} />;

      case ExpressionQueryType.reduce:
        return <ReduceConditionViewer model={model} />;

      case ExpressionQueryType.resample:
        return <ResampleExpressionViewer model={model} />;

      case ExpressionQueryType.classic:
        return <ClassicConditionViewer model={model} />;

      case ExpressionQueryType.threshold:
        return <ThresholdExpressionViewer model={model} />;

      default:
        return <>不支持的表达式： {model.type}</>;
    }
  }

  return (
    <QueryBox refId={refId} headerItems={[startCase(model.type)]} isAlertCondition={isAlertCondition}>
      {renderPreview()}
      {evalData && <ExpressionResult series={evalData.series} isAlertCondition={isAlertCondition} />}
    </QueryBox>
  );
}

interface QueryBoxProps extends React.PropsWithChildren<unknown> {
  refId: string;
  headerItems?: string[];
  isAlertCondition?: boolean;
  className?: string;
}

function QueryBox({ refId, headerItems = [], children, isAlertCondition, className }: QueryBoxProps) {
  const styles = useStyles2(getQueryBoxStyles);

  return (
    <div className={cx(styles.container, className)}>
      <header className={styles.header}>
        <span className={styles.refId}>{refId}</span>
        {headerItems.map((item, index) => (
          <span key={index} className={styles.textBlock}>
            {item}
          </span>
        ))}
        {isAlertCondition && (
          <div className={styles.conditionIndicator}>
            <Badge color="green" icon="check" text="警报条件" />
          </div>
        )}
      </header>
      {children}
    </div>
  );
}

const getQueryBoxStyles = (theme: GrafanaTheme2) => ({
  container: css`
    flex: 1 0 25%;
    border: 1px solid ${theme.colors.border.strong};
    max-width: 100%;
  `,
  header: css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing(1)};
    padding: ${theme.spacing(1)};
    background-color: ${theme.colors.background.secondary};
  `,
  textBlock: css`
    border: 1px solid ${theme.colors.border.weak};
    padding: ${theme.spacing(0.5, 1)};
    background-color: ${theme.colors.background.primary};
  `,
  refId: css`
    color: ${theme.colors.text.link};
    padding: ${theme.spacing(0.5, 1)};
    border: 1px solid ${theme.colors.border.weak};
  `,
  conditionIndicator: css`
    margin-left: auto;
  `,
});

function ClassicConditionViewer({ model }: { model: ExpressionQuery }) {
  const styles = useStyles2(getClassicConditionViewerStyles);

  const reducerFunctions = keyBy(alertDef.reducerTypes, (rt) => rt.value);
  const evalOperators = keyBy(alertDef.evalOperators, (eo) => eo.value);
  const evalFunctions = keyBy(alertDef.evalFunctions, (ef) => ef.value);

  return (
    <div className={styles.container}>
      {model.conditions?.map(({ query, operator, reducer, evaluator }, index) => {
        const isRange = isRangeEvaluator(evaluator);

        return (
          <React.Fragment key={index}>
            <div className={styles.blue}>
              {index === 0 ? 'WHEN' : !!operator?.type && evalOperators[operator?.type]?.text}
            </div>
            <div className={styles.bold}>{reducer?.type && reducerFunctions[reducer.type]?.text}</div>
            <div className={styles.blue}>属于</div>
            <div className={styles.bold}>{query.params[0]}</div>
            <div className={styles.blue}>{evalFunctions[evaluator.type].text}</div>
            <div className={styles.bold}>
              {isRange ? `(${evaluator.params[0]}; ${evaluator.params[1]})` : evaluator.params[0]}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

const getClassicConditionViewerStyles = (theme: GrafanaTheme2) => ({
  container: css`
    padding: ${theme.spacing(1)};
    display: grid;
    grid-template-columns: max-content max-content max-content max-content max-content max-content;
    gap: ${theme.spacing(0, 1)};
  `,
  ...getCommonQueryStyles(theme),
});

function ReduceConditionViewer({ model }: { model: ExpressionQuery }) {
  const styles = useStyles2(getReduceConditionViewerStyles);

  const { reducer, expression, settings } = model;
  const reducerType = reducerTypes.find((rt) => rt.value === reducer);

  const reducerMode = settings?.mode ?? ReducerMode.Strict;
  const modeName = reducerModes.find((rm) => rm.value === reducerMode);

  return (
    <div className={styles.container}>
      <div className={styles.label}>函数</div>
      <div className={styles.value}>{reducerType?.label}</div>

      <div className={styles.label}>输入</div>
      <div className={styles.value}>{expression}</div>

      <div className={styles.label}>模式</div>
      <div className={styles.value}>{modeName?.label}</div>
    </div>
  );
}

const getReduceConditionViewerStyles = (theme: GrafanaTheme2) => ({
  container: css`
    padding: ${theme.spacing(1)};
    display: grid;
    gap: ${theme.spacing(1)};
    grid-template-rows: 1fr 1fr;
    grid-template-columns: 1fr 1fr 1fr 1fr;

    > :nth-child(6) {
      grid-column: span 3;
    }
  `,
  ...getCommonQueryStyles(theme),
});

function ResampleExpressionViewer({ model }: { model: ExpressionQuery }) {
  const styles = useStyles2(getResampleExpressionViewerStyles);

  const { expression, window, downsampler, upsampler } = model;
  const downsamplerType = downsamplingTypes.find((dt) => dt.value === downsampler);
  const upsamplerType = upsamplingTypes.find((ut) => ut.value === upsampler);

  return (
    <div className={styles.container}>
      <div className={styles.label}>输入</div>
      <div className={styles.value}>{expression}</div>

      <div className={styles.label}>重采样至</div>
      <div className={styles.value}>{window}</div>

      <div className={styles.label}>下采样</div>
      <div className={styles.value}>{downsamplerType?.label}</div>

      <div className={styles.label}>上采样</div>
      <div className={styles.value}>{upsamplerType?.label}</div>
    </div>
  );
}

const getResampleExpressionViewerStyles = (theme: GrafanaTheme2) => ({
  container: css`
    padding: ${theme.spacing(1)};
    display: grid;
    gap: ${theme.spacing(1)};
    grid-template-columns: 1fr 1fr 1fr 1fr;
    grid-template-rows: 1fr 1fr;
  `,
  ...getCommonQueryStyles(theme),
});

function ThresholdExpressionViewer({ model }: { model: ExpressionQuery }) {
  const styles = useStyles2(getExpressionViewerStyles);

  const { expression, conditions } = model;

  const evaluator = conditions && conditions[0]?.evaluator;
  const thresholdFunction = thresholdFunctions.find((tf) => tf.value === evaluator?.type);

  const isRange = evaluator ? isRangeEvaluator(evaluator) : false;

  return (
    <div className={styles.container}>
      <div className={styles.label}>Input</div>
      <div className={styles.value}>{expression}</div>

      {evaluator && (
        <>
          <div className={styles.blue}>{thresholdFunction?.label}</div>
          <div className={styles.bold}>
            {isRange ? `(${evaluator.params[0]}; ${evaluator.params[1]})` : evaluator.params[0]}
          </div>
        </>
      )}
    </div>
  );
}

const getExpressionViewerStyles = (theme: GrafanaTheme2) => {
  const { blue, bold, ...common } = getCommonQueryStyles(theme);

  return {
    ...common,
    maxWidthContainer: css`
      max-width: 100%;
    `,
    container: css`
      padding: ${theme.spacing(1)};
      display: flex;
      gap: ${theme.spacing(1)};
    `,
    blue: css`
      ${blue};
      margin: auto 0;
    `,
    bold: css`
      ${bold};
      margin: auto 0;
    `,
  };
};

function MathExpressionViewer({ model }: { model: ExpressionQuery }) {
  const styles = useStyles2(getExpressionViewerStyles);

  const { expression } = model;

  return (
    <div className={styles.container}>
      <div className={styles.label}>Input</div>
      <div className={styles.value}>{expression}</div>
    </div>
  );
}

const getCommonQueryStyles = (theme: GrafanaTheme2) => ({
  blue: css`
    color: ${theme.colors.text.link};
  `,
  bold: css`
    font-weight: ${theme.typography.fontWeightBold};
  `,
  label: css`
    display: flex;
    align-items: center;
    padding: ${theme.spacing(0.5, 1)};
    background-color: ${theme.colors.background.secondary};
    font-size: ${theme.typography.bodySmall.fontSize};
    line-height: ${theme.typography.bodySmall.lineHeight};
    font-weight: ${theme.typography.fontWeightBold};
  `,
  value: css`
    padding: ${theme.spacing(0.5, 1)};
    border: 1px solid ${theme.colors.border.weak};
  `,
});

function isRangeEvaluator(evaluator: { params: number[]; type: EvalFunction }) {
  return evaluator.type === EvalFunction.IsWithinRange || evaluator.type === EvalFunction.IsOutsideRange;
}
