import { css } from '@emotion/css';
import { cloneDeep } from 'lodash';
import React, { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { getDefaultRelativeTimeRange, GrafanaTheme2 } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { Stack } from '@grafana/experimental';
import { config, getDataSourceSrv } from '@grafana/runtime';
import { Alert, Button, Dropdown, Field, Icon, InputControl, Menu, MenuItem, Tooltip, useStyles2 } from '@grafana/ui';
import { Text } from '@grafana/ui/src/components/Text/Text';
import { isExpressionQuery } from 'app/features/expressions/guards';
import { ExpressionDatasourceUID, ExpressionQueryType, expressionTypes } from 'app/features/expressions/types';
import { useDispatch } from 'app/types';
import { AlertQuery } from 'app/types/unified-alerting-dto';

import { useRulesSourcesWithRuler } from '../../../hooks/useRuleSourcesWithRuler';
import { fetchAllPromBuildInfoAction } from '../../../state/actions';
import { RuleFormType, RuleFormValues } from '../../../types/rule-form';
import { getDefaultOrFirstCompatibleDataSource } from '../../../utils/datasource';
import { isPromOrLokiQuery, PromOrLokiQuery } from '../../../utils/rule-form';
import { ExpressionEditor } from '../ExpressionEditor';
import { ExpressionsEditor } from '../ExpressionsEditor';
import { NeedHelpInfo } from '../NeedHelpInfo';
import { QueryEditor } from '../QueryEditor';
import { RecordingRuleEditor } from '../RecordingRuleEditor';
import { RuleEditorSection } from '../RuleEditorSection';
import { errorFromSeries, findRenamedDataQueryReferences, refIdExists } from '../util';

import { CloudDataSourceSelector } from './CloudDataSourceSelector';
import { SmartAlertTypeDetector } from './SmartAlertTypeDetector';
import {
  addExpressions,
  addNewDataQuery,
  addNewExpression,
  duplicateQuery,
  queriesAndExpressionsReducer,
  removeExpression,
  removeExpressions,
  rewireExpressions,
  setDataQueries,
  setRecordingRulesQueries,
  updateExpression,
  updateExpressionRefId,
  updateExpressionTimeRange,
  updateExpressionType,
} from './reducer';
import { useAlertQueryRunner } from './useAlertQueryRunner';

interface Props {
  editingExistingRule: boolean;
  onDataChange: (error: string) => void;
}

export const QueryAndExpressionsStep = ({ editingExistingRule, onDataChange }: Props) => {
  const {
    setValue,
    getValues,
    watch,
    formState: { errors },
    control,
  } = useFormContext<RuleFormValues>();

  const { queryPreviewData, runQueries, cancelQueries, isPreviewLoading, clearPreviewData } = useAlertQueryRunner();

  const initialState = {
    queries: getValues('queries'),
  };

  const [{ queries }, dispatch] = useReducer(queriesAndExpressionsReducer, initialState);
  const [type, condition, dataSourceName] = watch(['type', 'condition', 'dataSourceName']);

  const isGrafanaManagedType = type === RuleFormType.grafana;
  const isRecordingRuleType = type === RuleFormType.cloudRecording;
  const isCloudAlertRuleType = type === RuleFormType.cloudAlerting;

  const dispatchReduxAction = useDispatch();
  useEffect(() => {
    dispatchReduxAction(fetchAllPromBuildInfoAction());
  }, [dispatchReduxAction]);

  const rulesSourcesWithRuler = useRulesSourcesWithRuler();

  const runQueriesPreview = useCallback(() => {
    runQueries(getValues('queries'));
  }, [runQueries, getValues]);

  // whenever we update the queries we have to update the form too
  useEffect(() => {
    setValue('queries', queries, { shouldValidate: false });
  }, [queries, runQueries, setValue]);

  const noCompatibleDataSources = getDefaultOrFirstCompatibleDataSource() === undefined;

  // data queries only
  const dataQueries = useMemo(() => {
    return queries.filter((query) => !isExpressionQuery(query.model));
  }, [queries]);

  // expression queries only
  const expressionQueries = useMemo(() => {
    return queries.filter((query) => isExpressionQuery(query.model));
  }, [queries]);

  const emptyQueries = queries.length === 0;

  useEffect(() => {
    const currentCondition = getValues('condition');

    if (!currentCondition || RuleFormType.cloudRecording) {
      return;
    }

    const error = errorFromSeries(queryPreviewData[currentCondition]?.series || []);
    onDataChange(error?.message || '');
  }, [queryPreviewData, getValues, onDataChange]);

  const handleSetCondition = useCallback(
    (refId: string | null) => {
      if (!refId) {
        return;
      }

      runQueriesPreview(); //we need to run the queries to know if the condition is valid

      setValue('condition', refId);
    },
    [runQueriesPreview, setValue]
  );

  const onUpdateRefId = useCallback(
    (oldRefId: string, newRefId: string) => {
      const newRefIdExists = refIdExists(queries, newRefId);
      // TODO we should set an error and explain what went wrong instead of just refusing to update
      if (newRefIdExists) {
        return;
      }

      dispatch(updateExpressionRefId({ oldRefId, newRefId }));

      // update condition too if refId was updated
      if (condition === oldRefId) {
        handleSetCondition(newRefId);
      }
    },
    [condition, queries, handleSetCondition]
  );

  const updateExpressionAndDatasource = useSetExpressionAndDataSource();

  const onChangeQueries = useCallback(
    (updatedQueries: AlertQuery[]) => {
      // Most data sources triggers onChange and onRunQueries consecutively
      // It means our reducer state is always one step behind when runQueries is invoked
      // Invocation cycle => onChange -> dispatch(setDataQueries) -> onRunQueries -> setDataQueries Reducer
      // As a workaround we update form values as soon as possible to avoid stale state
      // This way we can access up to date queries in runQueriesPreview without waiting for re-render
      setValue('queries', updatedQueries, { shouldValidate: false });

      updateExpressionAndDatasource(updatedQueries);

      dispatch(setDataQueries(updatedQueries));
      dispatch(updateExpressionTimeRange());

      // check if we need to rewire expressions (and which ones)
      const [oldRefId, newRefId] = findRenamedDataQueryReferences(queries, updatedQueries);
      if (oldRefId && newRefId) {
        dispatch(rewireExpressions({ oldRefId, newRefId }));
      }
    },
    [queries, setValue, updateExpressionAndDatasource]
  );

  const onChangeRecordingRulesQueries = useCallback(
    (updatedQueries: AlertQuery[]) => {
      const query = updatedQueries[0];

      const dataSourceSettings = getDataSourceSrv().getInstanceSettings(query.datasourceUid);
      if (!dataSourceSettings) {
        throw new Error('The Data source has not been defined.');
      }

      if (!isPromOrLokiQuery(query.model)) {
        return;
      }

      const expression = query.model.expr;

      setValue('queries', updatedQueries, { shouldValidate: false });
      setValue('dataSourceName', dataSourceSettings.name);
      setValue('expression', expression);

      dispatch(setRecordingRulesQueries({ recordingRuleQueries: updatedQueries, expression }));
      runQueriesPreview();
    },
    [runQueriesPreview, setValue]
  );

  const recordingRuleDefaultDatasource = rulesSourcesWithRuler[0];

  useEffect(() => {
    clearPreviewData();
    if (type === RuleFormType.cloudRecording) {
      const expr = getValues('expression');

      if (!recordingRuleDefaultDatasource) {
        return;
      }

      const datasourceUid =
        (editingExistingRule && getDataSourceSrv().getInstanceSettings(dataSourceName)?.uid) ||
        recordingRuleDefaultDatasource.uid;

      const defaultQuery = {
        refId: 'A',
        datasourceUid,
        queryType: '',
        relativeTimeRange: getDefaultRelativeTimeRange(),
        expr,
        model: {
          refId: 'A',
          hide: false,
          expr,
        },
      };
      dispatch(setRecordingRulesQueries({ recordingRuleQueries: [defaultQuery], expression: expr }));
    }
  }, [type, recordingRuleDefaultDatasource, editingExistingRule, getValues, dataSourceName, clearPreviewData]);

  const onDuplicateQuery = useCallback((query: AlertQuery) => {
    dispatch(duplicateQuery(query));
  }, []);

  // update the condition if it's been removed
  useEffect(() => {
    if (!refIdExists(queries, condition)) {
      const lastRefId = queries.at(-1)?.refId ?? null;
      handleSetCondition(lastRefId);
    }
  }, [condition, queries, handleSetCondition]);

  const onClickType = useCallback(
    (type: ExpressionQueryType) => {
      dispatch(addNewExpression(type));
    },
    [dispatch]
  );

  const styles = useStyles2(getStyles);

  // Cloud alerts load data from form values
  // whereas Grafana managed alerts load data from reducer
  //when data source is changed in the cloud selector we need to update the queries in the reducer

  const onChangeCloudDatasource = useCallback(
    (datasourceUid: string) => {
      const newQueries = cloneDeep(queries);
      newQueries[0].datasourceUid = datasourceUid;
      setValue('queries', newQueries, { shouldValidate: false });

      updateExpressionAndDatasource(newQueries);

      dispatch(setDataQueries(newQueries));
    },
    [queries, setValue, updateExpressionAndDatasource, dispatch]
  );

  // ExpressionEditor for cloud query needs to update queries in the reducer and in the form
  // otherwise the value is not updated for Grafana managed alerts

  const onChangeExpression = (value: string) => {
    const newQueries = cloneDeep(queries);

    if (newQueries[0].model) {
      if (isPromOrLokiQuery(newQueries[0].model)) {
        newQueries[0].model.expr = value;
      } else {
        // first time we come from grafana-managed type
        // we need to convert the model to PromOrLokiQuery
        const promLoki: PromOrLokiQuery = {
          ...cloneDeep(newQueries[0].model),
          expr: value,
        };
        newQueries[0].model = promLoki;
      }
    }

    setValue('queries', newQueries, { shouldValidate: false });

    updateExpressionAndDatasource(newQueries);

    dispatch(setDataQueries(newQueries));
    runQueriesPreview();
  };

  const removeExpressionsInQueries = useCallback(() => dispatch(removeExpressions()), [dispatch]);

  const addExpressionsInQueries = useCallback(
    (expressions: AlertQuery[]) => dispatch(addExpressions(expressions)),
    [dispatch]
  );

  // we need to keep track of the previous expressions and condition reference to be able to restore them when switching back to grafana managed
  const [prevExpressions, setPrevExpressions] = useState<AlertQuery[]>([]);
  const [prevCondition, setPrevCondition] = useState<string | null>(null);

  const restoreExpressionsInQueries = useCallback(() => {
    addExpressionsInQueries(prevExpressions);
  }, [prevExpressions, addExpressionsInQueries]);

  const onClickSwitch = useCallback(() => {
    const typeInForm = getValues('type');
    if (typeInForm === RuleFormType.cloudAlerting) {
      setValue('type', RuleFormType.grafana);
      prevExpressions.length > 0 && restoreExpressionsInQueries();
      prevCondition && setValue('condition', prevCondition);
    } else {
      setValue('type', RuleFormType.cloudAlerting);
      const expressions = queries.filter((query) => query.datasourceUid === ExpressionDatasourceUID);
      setPrevExpressions(expressions);
      removeExpressionsInQueries();
      setPrevCondition(condition);
    }
  }, [
    getValues,
    setValue,
    queries,
    removeExpressionsInQueries,
    restoreExpressionsInQueries,
    setPrevExpressions,
    prevExpressions,
    prevCondition,
    condition,
  ]);

  return (
    <RuleEditorSection
      stepNo={2}
      title={type !== RuleFormType.cloudRecording ? '定义查询和警报条件' : '定义查询'}
    >
      {/* This is the cloud data source selector */}
      {(type === RuleFormType.cloudRecording || type === RuleFormType.cloudAlerting) && (
        <CloudDataSourceSelector onChangeCloudDatasource={onChangeCloudDatasource} disabled={editingExistingRule} />
      )}

      {/* This is the PromQL Editor for recording rules */}
      {isRecordingRuleType && dataSourceName && (
        <Field error={errors.expression?.message} invalid={!!errors.expression?.message}>
          <RecordingRuleEditor
            dataSourceName={dataSourceName}
            queries={queries}
            runQueries={runQueriesPreview}
            onChangeQuery={onChangeRecordingRulesQueries}
            panelData={queryPreviewData}
          />
        </Field>
      )}

      {/* This is the PromQL Editor for Cloud rules */}
      {isCloudAlertRuleType && dataSourceName && (
        <Stack direction="column">
          <Field error={errors.expression?.message} invalid={!!errors.expression?.message}>
            <InputControl
              name="expression"
              render={({ field: { ref, ...field } }) => {
                return (
                  <ExpressionEditor
                    {...field}
                    dataSourceName={dataSourceName}
                    showPreviewAlertsButton={!isRecordingRuleType}
                    onChange={onChangeExpression}
                  />
                );
              }}
              control={control}
              rules={{
                required: { value: true, message: '需要有效的表达式' },
              }}
            />
          </Field>
          <SmartAlertTypeDetector
            editingExistingRule={editingExistingRule}
            queries={queries}
            rulesSourcesWithRuler={rulesSourcesWithRuler}
            onClickSwitch={onClickSwitch}
          />
        </Stack>
      )}

      {/* This is the editor for Grafana managed rules */}
      {isGrafanaManagedType && (
        <Stack direction="column">
          {/* Data Queries */}
          <Stack direction="row" gap={1} alignItems="baseline">
            <div className={styles.mutedText}>
              定义查询和/或表达式，然后选择其中一个作为警报规则条件。这是警报规则必须达到或超过才能触发的阈值。
            </div>

            <NeedHelpInfo
              contentText={`警报规则由一个或多个查询和表达式组成，用于选择要度量的数据。定义查询和/或表达式，然后选择其中一个作为警报规则条件。这是警报规则必须达到或超过才能触发的阈值。有关查询和表达式的详细信息，请参阅查询和转换数据。`}
              externalLink={`https://grafana.com/docs/grafana/latest/panels-visualizations/query-transform-data/`}
              linkText={`阅读有关查询和条件的信息`}
              title="定义查询和警报条件"
            />
          </Stack>

          <QueryEditor
            queries={dataQueries}
            expressions={expressionQueries}
            onRunQueries={runQueriesPreview}
            onChangeQueries={onChangeQueries}
            onDuplicateQuery={onDuplicateQuery}
            panelData={queryPreviewData}
            condition={condition}
            onSetCondition={handleSetCondition}
          />
          <Tooltip content={'您似乎没有兼容的数据源'} show={noCompatibleDataSources}>
            <Button
              type="button"
              onClick={() => {
                dispatch(addNewDataQuery());
              }}
              variant="secondary"
              aria-label={selectors.components.QueryTab.addQuery}
              disabled={noCompatibleDataSources}
              className={styles.addQueryButton}
            >
              新增查询
            </Button>
          </Tooltip>
          <SmartAlertTypeDetector
            editingExistingRule={editingExistingRule}
            rulesSourcesWithRuler={rulesSourcesWithRuler}
            queries={queries}
            onClickSwitch={onClickSwitch}
          />
          {/* Expression Queries */}
          <Text element="h5">Expressions</Text>
          <div className={styles.mutedText}>Manipulate data returned from queries with math and other operations.</div>
          <ExpressionsEditor
            queries={queries}
            panelData={queryPreviewData}
            condition={condition}
            onSetCondition={handleSetCondition}
            onRemoveExpression={(refId) => {
              dispatch(removeExpression(refId));
            }}
            onUpdateRefId={onUpdateRefId}
            onUpdateExpressionType={(refId, type) => {
              dispatch(updateExpressionType({ refId, type }));
            }}
            onUpdateQueryExpression={(model) => {
              dispatch(updateExpression(model));
            }}
          />
          {/* action buttons */}
          <Stack direction="row">
            {config.expressionsEnabled && <TypeSelectorButton onClickType={onClickType} />}

            {isPreviewLoading && (
              <Button icon="fa fa-spinner" type="button" variant="destructive" onClick={cancelQueries}>
                取消
              </Button>
            )}
            {!isPreviewLoading && (
              <Button icon="sync" type="button" onClick={runQueriesPreview} disabled={emptyQueries}>
                预览
              </Button>
            )}
          </Stack>

          {/* No Queries */}
          {emptyQueries && (
            <Alert title="No queries or expressions have been configured" severity="warning">
              创建至少一个要发出警报的查询或表达式
            </Alert>
          )}
        </Stack>
      )}
    </RuleEditorSection>
  );
};

function TypeSelectorButton({ onClickType }: { onClickType: (type: ExpressionQueryType) => void }) {
  const newMenu = (
    <Menu>
      {expressionTypes.map((type) => (
        <Tooltip key={type.value} content={type.description ?? ''} placement="right">
          <MenuItem
            key={type.value}
            onClick={() => onClickType(type.value ?? ExpressionQueryType.math)}
            label={type.label ?? ''}
          />
        </Tooltip>
      ))}
    </Menu>
  );

  return (
    <Dropdown overlay={newMenu}>
      <Button variant="secondary">
        添加表达式
        <Icon name="angle-down" />
      </Button>
    </Dropdown>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  mutedText: css`
    color: ${theme.colors.text.secondary};
    font-size: ${theme.typography.size.sm};
    margin-top: ${theme.spacing(-1)};
  `,
  addQueryButton: css`
    width: fit-content;
  `,
  helpInfo: css`
    display: flex;
    flex-direction: row;
    align-items: center;
    width: fit-content;
    font-weight: ${theme.typography.fontWeightMedium};
    margin-left: ${theme.spacing(1)};
    font-size: ${theme.typography.size.sm};
    cursor: pointer;
  `,
  helpInfoText: css`
    margin-left: ${theme.spacing(0.5)};
    text-decoration: underline;
  `,
  infoLink: css`
    color: ${theme.colors.text.link};
  `,
});

const useSetExpressionAndDataSource = () => {
  const { setValue } = useFormContext<RuleFormValues>();

  return (updatedQueries: AlertQuery[]) => {
    // update data source name and expression if it's been changed in the queries from the reducer when prom or loki query
    const query = updatedQueries[0];
    if (!query) {
      return;
    }

    const dataSourceSettings = getDataSourceSrv().getInstanceSettings(query.datasourceUid);
    if (!dataSourceSettings) {
      throw new Error('The Data source has not been defined.');
    }
    setValue('dataSourceName', dataSourceSettings.name);

    if (isPromOrLokiQuery(query.model)) {
      const expression = query.model.expr;

      setValue('expression', expression);
    }
  };
};
