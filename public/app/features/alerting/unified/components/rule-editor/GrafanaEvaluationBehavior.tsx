import { css } from '@emotion/css';
import React, { useCallback, useEffect, useState } from 'react';
import { RegisterOptions, useFormContext } from 'react-hook-form';

import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { Stack } from '@grafana/experimental';
import { Field, Icon, IconButton, Input, InputControl, Label, Switch, Tooltip, useStyles2 } from '@grafana/ui';

import { CombinedRuleGroup, CombinedRuleNamespace } from '../../../../../types/unified-alerting';
import { logInfo, LogMessages } from '../../Analytics';
import { useCombinedRuleNamespaces } from '../../hooks/useCombinedRuleNamespaces';
import { useUnifiedAlertingSelector } from '../../hooks/useUnifiedAlertingSelector';
import { RuleFormValues } from '../../types/rule-form';
import { GRAFANA_RULES_SOURCE_NAME } from '../../utils/datasource';
import { parsePrometheusDuration } from '../../utils/time';
import { CollapseToggle } from '../CollapseToggle';
import { EditCloudGroupModal } from '../rules/EditRuleGroupModal';

import { FolderAndGroup, useGetGroupOptionsFromFolder } from './FolderAndGroup';
import { GrafanaAlertStatePicker } from './GrafanaAlertStatePicker';
import { NeedHelpInfo } from './NeedHelpInfo';
import { RuleEditorSection } from './RuleEditorSection';

export const MIN_TIME_RANGE_STEP_S = 10; // 10 seconds

const forValidationOptions = (evaluateEvery: string): RegisterOptions => ({
  required: {
    value: true,
    message: 'Required.',
  },
  validate: (value: string) => {
    // parsePrometheusDuration does not allow 0 but does allow 0s
    if (value === '0') {
      return true;
    }

    try {
      const millisFor = parsePrometheusDuration(value);

      // 0 is a special value meaning for equals evaluation interval
      if (millisFor === 0) {
        return true;
      }

      try {
        const millisEvery = parsePrometheusDuration(evaluateEvery);
        return millisFor >= millisEvery
          ? true
          : 'For duration must be greater than or equal to the evaluation interval.';
      } catch (err) {
        // if we fail to parse "every", assume validation is successful, or the error messages
        // will overlap in the UI
        return true;
      }
    } catch (error) {
      return error instanceof Error ? error.message : 'Failed to parse duration';
    }
  },
});

const useIsNewGroup = (folder: string, group: string) => {
  const { groupOptions } = useGetGroupOptionsFromFolder(folder);

  const groupIsInGroupOptions = useCallback(
    (group_: string) => groupOptions.some((groupInList: SelectableValue<string>) => groupInList.label === group_),
    [groupOptions]
  );
  return !groupIsInGroupOptions(group);
};

function FolderGroupAndEvaluationInterval({
  evaluateEvery,
  setEvaluateEvery,
}: {
  evaluateEvery: string;
  setEvaluateEvery: (value: string) => void;
}) {
  const styles = useStyles2(getStyles);
  const { watch, setValue, getValues } = useFormContext<RuleFormValues>();
  const [isEditingGroup, setIsEditingGroup] = useState(false);

  const [groupName, folderName] = watch(['group', 'folder.title']);

  const rulerRuleRequests = useUnifiedAlertingSelector((state) => state.rulerRules);
  const groupfoldersForGrafana = rulerRuleRequests[GRAFANA_RULES_SOURCE_NAME];

  const grafanaNamespaces = useCombinedRuleNamespaces(GRAFANA_RULES_SOURCE_NAME);
  const existingNamespace = grafanaNamespaces.find((ns) => ns.name === folderName);
  const existingGroup = existingNamespace?.groups.find((g) => g.name === groupName);

  const isNewGroup = useIsNewGroup(folderName ?? '', groupName);

  useEffect(() => {
    if (!isNewGroup && existingGroup?.interval) {
      setEvaluateEvery(existingGroup.interval);
    }
  }, [setEvaluateEvery, isNewGroup, setValue, existingGroup]);

  const closeEditGroupModal = (saved = false) => {
    if (!saved) {
      logInfo(LogMessages.leavingRuleGroupEdit);
    }
    setIsEditingGroup(false);
  };

  const onOpenEditGroupModal = () => setIsEditingGroup(true);

  const editGroupDisabled = groupfoldersForGrafana?.loading || isNewGroup || !folderName || !groupName;

  const emptyNamespace: CombinedRuleNamespace = {
    name: folderName,
    rulesSource: GRAFANA_RULES_SOURCE_NAME,
    groups: [],
  };
  const emptyGroup: CombinedRuleGroup = { name: groupName, interval: evaluateEvery, rules: [], totals: {} };

  return (
    <div>
      <FolderAndGroup groupfoldersForGrafana={groupfoldersForGrafana?.result} />
      {folderName && isEditingGroup && (
        <EditCloudGroupModal
          namespace={existingNamespace ?? emptyNamespace}
          group={existingGroup ?? emptyGroup}
          onClose={() => closeEditGroupModal()}
          intervalEditOnly
          hideFolder={true}
        />
      )}
      {folderName && groupName && (
        <div className={styles.evaluationContainer}>
          <Stack direction="column" gap={0}>
            <div className={styles.marginTop}>
              <Stack direction="column" gap={1}>
                {getValues('group') && getValues('evaluateEvery') && (
                  <span>
                    All rules in the selected group are evaluated every {evaluateEvery}.{' '}
                    {!isNewGroup && (
                      <IconButton
                        name="pen"
                        aria-label="Edit"
                        disabled={editGroupDisabled}
                        onClick={onOpenEditGroupModal}
                      />
                    )}
                  </span>
                )}
              </Stack>
            </div>
          </Stack>
        </div>
      )}
    </div>
  );
}

function ForInput({ evaluateEvery }: { evaluateEvery: string }) {
  const styles = useStyles2(getStyles);
  const {
    register,
    formState: { errors },
  } = useFormContext<RuleFormValues>();

  const evaluateForId = 'eval-for-input';

  return (
    <Stack direction="row" justify-content="flex-start" align-items="flex-start">
      <Field
        label={
          <Label
            htmlFor="evaluateFor"
            description="警报规则可能违反条件的时间段，直到警报规则触发。"
          >
            等待时限
          </Label>
        }
        className={styles.inlineField}
        error={errors.evaluateFor?.message}
        invalid={!!errors.evaluateFor?.message}
        validationMessageHorizontalOverflow={true}
      >
        <Input id={evaluateForId} width={8} {...register('evaluateFor', forValidationOptions(evaluateEvery))} />
      </Field>
    </Stack>
  );
}

function getDescription() {
  const textToRender = '定义如何评估警报规则。';
  const docsLink = 'https://www.smxyi.com/datav/alerting/fundamentals/alert-rules/rule-evaluation/';
  return (
    <Stack gap={0.5}>
      {`${textToRender}`}
      <NeedHelpInfo
        contentText="评估组是用于评估警报和记录规则的容器。评估组定义评估间隔 - 检查规则的频率。按顺序评估同一评估组中的警报规则"
        externalLink={docsLink}
        linkText={`阅读有关评估的信息`}
        title="评估"
      />
    </Stack>
  );
}

export function GrafanaEvaluationBehavior({
  evaluateEvery,
  setEvaluateEvery,
  existing,
}: {
  evaluateEvery: string;
  setEvaluateEvery: (value: string) => void;
  existing: boolean;
}) {
  const styles = useStyles2(getStyles);
  const [showErrorHandling, setShowErrorHandling] = useState(false);

  const { watch, setValue } = useFormContext<RuleFormValues>();

  const isPaused = watch('isPaused');

  return (
    // TODO remove "and alert condition" for recording rules
    <RuleEditorSection stepNo={3} title="设置警报评估行为" description={getDescription()}>
      <Stack direction="column" justify-content="flex-start" align-items="flex-start">
        <FolderGroupAndEvaluationInterval setEvaluateEvery={setEvaluateEvery} evaluateEvery={evaluateEvery} />
        <ForInput evaluateEvery={evaluateEvery} />

        {existing && (
          <Field htmlFor="pause-alert-switch">
            <InputControl
              render={() => (
                <Stack gap={1} direction="row" alignItems="center">
                  <Switch
                    id="pause-alert"
                    onChange={(value) => {
                      setValue('isPaused', value.currentTarget.checked);
                    }}
                    value={Boolean(isPaused)}
                  />
                  <label htmlFor="pause-alert" className={styles.switchLabel}>
                     暂停评估
                    <Tooltip placement="top" content="启用此选项可暂停此警报规则的评估。" theme={'info'}>
                      <Icon tabIndex={0} name="info-circle" size="sm" className={styles.infoIcon} />
                    </Tooltip>
                  </label>
                </Stack>
              )}
              name="isPaused"
            />
          </Field>
        )}
      </Stack>
      <CollapseToggle
        isCollapsed={!showErrorHandling}
        onToggle={(collapsed) => setShowErrorHandling(!collapsed)}
        text="不配置数据和错误处理"
        className={styles.collapseToggle}
      />
      {showErrorHandling && (
        <>
          <Field htmlFor="no-data-state-input" label="没有数据或所有值都为空时的警报状态">
            <InputControl
              render={({ field: { onChange, ref, ...field } }) => (
                <GrafanaAlertStatePicker
                  {...field}
                  inputId="no-data-state-input"
                  width={42}
                  includeNoData={true}
                  includeError={false}
                  onChange={(value) => onChange(value?.value)}
                />
              )}
              name="noDataState"
            />
          </Field>
          <Field htmlFor="exec-err-state-input" label="执行错误或超时时的警报状态">
            <InputControl
              render={({ field: { onChange, ref, ...field } }) => (
                <GrafanaAlertStatePicker
                  {...field}
                  inputId="exec-err-state-input"
                  width={42}
                  includeNoData={false}
                  includeError={true}
                  onChange={(value) => onChange(value?.value)}
                />
              )}
              name="execErrState"
            />
          </Field>
        </>
      )}
    </RuleEditorSection>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  inlineField: css`
    margin-bottom: 0;
  `,
  collapseToggle: css`
    margin: ${theme.spacing(2, 0, 2, -1)};
  `,
  evaluateLabel: css`
    margin-right: ${theme.spacing(1)};
  `,
  evaluationContainer: css`
    color: ${theme.colors.text.secondary};
    max-width: ${theme.breakpoints.values.sm}px;
    font-size: ${theme.typography.size.sm};
  `,
  intervalChangedLabel: css`
    margin-bottom: ${theme.spacing(1)};
  `,
  warningIcon: css`
    justify-self: center;
    margin-right: ${theme.spacing(1)};
    color: ${theme.colors.warning.text};
  `,
  infoIcon: css`
    margin-left: 10px;
  `,
  warningMessage: css`
    color: ${theme.colors.warning.text};
  `,
  bold: css`
    font-weight: bold;
  `,
  alignInterval: css`
    margin-top: ${theme.spacing(1)};
    margin-left: -${theme.spacing(1)};
  `,
  marginTop: css`
    margin-top: ${theme.spacing(1)};
  `,
  switchLabel: css(`
    color: ${theme.colors.text.primary},
    cursor: 'pointer',
    fontSize: ${theme.typography.bodySmall.fontSize},
  `),
});
