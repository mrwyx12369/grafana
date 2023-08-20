import { css } from '@emotion/css';
import React from 'react';
import { useFormContext } from 'react-hook-form';

import { DataSourceInstanceSettings, GrafanaTheme2 } from '@grafana/data';
import { Stack } from '@grafana/experimental';
import { DataSourceJsonData } from '@grafana/schema';
import { Alert, useStyles2 } from '@grafana/ui';
import { contextSrv } from 'app/core/core';
import { ExpressionDatasourceUID } from 'app/features/expressions/types';
import { AccessControlAction } from 'app/types';
import { AlertQuery } from 'app/types/unified-alerting-dto';

import { RuleFormType, RuleFormValues } from '../../../types/rule-form';
import { NeedHelpInfo } from '../NeedHelpInfo';

function getAvailableRuleTypes() {
  const canCreateGrafanaRules = contextSrv.hasAccess(
    AccessControlAction.AlertingRuleCreate,
    contextSrv.hasEditPermissionInFolders
  );
  const canCreateCloudRules = contextSrv.hasAccess(AccessControlAction.AlertingRuleExternalWrite, contextSrv.isEditor);
  const defaultRuleType = canCreateGrafanaRules ? RuleFormType.grafana : RuleFormType.cloudAlerting;

  const enabledRuleTypes: RuleFormType[] = [];
  if (canCreateGrafanaRules) {
    enabledRuleTypes.push(RuleFormType.grafana);
  }
  if (canCreateCloudRules) {
    enabledRuleTypes.push(RuleFormType.cloudAlerting, RuleFormType.cloudRecording);
  }

  return { enabledRuleTypes, defaultRuleType };
}

const onlyOneDSInQueries = (queries: AlertQuery[]) => {
  return queries.filter((q) => q.datasourceUid !== ExpressionDatasourceUID).length === 1;
};
const getCanSwitch = ({
  queries,
  ruleFormType,
  editingExistingRule,
  rulesSourcesWithRuler,
}: {
  rulesSourcesWithRuler: Array<DataSourceInstanceSettings<DataSourceJsonData>>;
  queries: AlertQuery[];
  ruleFormType: RuleFormType | undefined;
  editingExistingRule: boolean;
}) => {
  // get available rule types
  const availableRuleTypes = getAvailableRuleTypes();

  // check if we have only one query in queries and if it's a cloud datasource
  const onlyOneDS = onlyOneDSInQueries(queries);
  const dataSourceIdFromQueries = queries[0]?.datasourceUid ?? '';
  const isRecordingRuleType = ruleFormType === RuleFormType.cloudRecording;

  //let's check if we switch to cloud type
  const canSwitchToCloudRule =
    !editingExistingRule &&
    !isRecordingRuleType &&
    onlyOneDS &&
    rulesSourcesWithRuler.some((dsJsonData) => dsJsonData.uid === dataSourceIdFromQueries);

  const canSwitchToGrafanaRule = !editingExistingRule && !isRecordingRuleType;
  // check for enabled types
  const grafanaTypeEnabled = availableRuleTypes.enabledRuleTypes.includes(RuleFormType.grafana);
  const cloudTypeEnabled = availableRuleTypes.enabledRuleTypes.includes(RuleFormType.cloudAlerting);

  // can we switch to the other type? (cloud or grafana)
  const canSwitchFromCloudToGrafana =
    ruleFormType === RuleFormType.cloudAlerting && grafanaTypeEnabled && canSwitchToGrafanaRule;
  const canSwitchFromGrafanaToCloud =
    ruleFormType === RuleFormType.grafana && canSwitchToCloudRule && cloudTypeEnabled && canSwitchToCloudRule;

  return canSwitchFromCloudToGrafana || canSwitchFromGrafanaToCloud;
};

export interface SmartAlertTypeDetectorProps {
  editingExistingRule: boolean;
  rulesSourcesWithRuler: Array<DataSourceInstanceSettings<DataSourceJsonData>>;
  queries: AlertQuery[];
  onClickSwitch: () => void;
}

const getContentText = (ruleFormType: RuleFormType, isEditing: boolean, dataSourceName: string, canSwitch: boolean) => {
  if (isEditing) {
    if (ruleFormType === RuleFormType.grafana) {
      return {
        contentText: `通过系统管理的警报规则，可以创建可对来自任何受支持数据源的数据执行操作的警报，包括在同一规则中具有多个数据源。您还可以添加表达式来转换数据并设置警报条件。还支持在警报通知中使用图像。`,
        title: `此警报规则由系统管理。`,
      };
    } else {
      return {
        contentText: `数据源管理的警报规则可用于已配置为支持规则创建的 Grafana Mimir 或 Grafana Loki 数据源。不支持使用表达式或多个查询。`,
        title: `此警报规则由数据源管理 ${dataSourceName}.`,
      };
    }
  }
  if (canSwitch) {
    if (ruleFormType === RuleFormType.cloudAlerting) {
      return {
        contentText:
          '数据源管理的警报规则可用于已配置为支持规则创建的 Grafana Mimir 或 Grafana Loki 数据源。不支持使用表达式或多个查询。',
        title: `此警报规则由数据源${dataSourceName}管理. 如果要使用表达式或有多个查询，请切换到系统管理的警报规则。`,
      };
    } else {
      return {
        contentText:
          '通过系统管理的警报规则，可以创建可对来自任何受支持数据源的数据执行操作的警报，包括在同一规则中具有多个数据源。您还可以添加表达式来转换数据并设置警报条件。还支持在警报通知中使用图像。',
        title: `此警报规则将由系统管理。所选数据源配置为支持规则创建。`,
      };
    }
  } else {
    // it can be only grafana rule
    return {
      contentText: `通过系统管理的警报规则，可以创建可对来自任何受支持数据源的数据执行操作的警报，包括在同一规则中具有多个数据源。您还可以添加表达式来转换数据并设置警报条件。还支持在警报通知中使用图像。`,
      title: `根据所选数据源，此警报规则由系统管理。`,
    };
  }
};

export function SmartAlertTypeDetector({
  editingExistingRule,
  rulesSourcesWithRuler,
  queries,
  onClickSwitch,
}: SmartAlertTypeDetectorProps) {
  const { getValues } = useFormContext<RuleFormValues>();

  const [ruleFormType, dataSourceName] = getValues(['type', 'dataSourceName']);
  const styles = useStyles2(getStyles);

  const canSwitch = getCanSwitch({ queries, ruleFormType, editingExistingRule, rulesSourcesWithRuler });

  const typeTitle =
    ruleFormType === RuleFormType.cloudAlerting ? '数据源管理的警报规则' : '系统管理的警报规则';
  const switchToLabel = ruleFormType !== RuleFormType.cloudAlerting ? '数据源管理' : '系统管理';

  const content = ruleFormType
    ? getContentText(ruleFormType, editingExistingRule, dataSourceName ?? '', canSwitch)
    : undefined;

  return (
    <div className={styles.alert}>
      <Alert
        severity="info"
        title={typeTitle}
        onRemove={canSwitch ? onClickSwitch : undefined}
        buttonContent={`切换${switchToLabel}规则`}
      >
        <Stack gap={0.5} direction="row" alignItems={'baseline'}>
          <div className={styles.alertText}>{content?.title}</div>
          <div className={styles.needInfo}>
            <NeedHelpInfo
              contentText={content?.contentText ?? ''}
              externalLink={`https://www.smxyi.com/datav/alert-rules/alert-rule-types/`}
              linkText={`阅读有关警报规则类型的信息`}
              title=" 报规则类型"
            />
          </div>
        </Stack>
      </Alert>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  alertText: css`
    max-width: fit-content;
    flex: 1;
  `,
  alert: css`
    margin-top: ${theme.spacing(2)};
  `,
  needInfo: css`
    flex: 1;
    max-width: fit-content;
  `,
});
