import { css } from '@emotion/css';
import React from 'react';
import { useFormContext } from 'react-hook-form';

import { GrafanaTheme2 } from '@grafana/data';
import { Stack } from '@grafana/experimental';
import { useStyles2 } from '@grafana/ui';

import { RuleFormType, RuleFormValues } from '../../types/rule-form';

import AnnotationsField from './AnnotationsField';
import { GroupAndNamespaceFields } from './GroupAndNamespaceFields';
import { NeedHelpInfo } from './NeedHelpInfo';
import { RuleEditorSection } from './RuleEditorSection';

function getDescription(ruleType: RuleFormType | undefined, styles: { [key: string]: string }) {
  const annotationsText = '添加注解以在警报通知中提供更多上下文。';

  if (ruleType === RuleFormType.cloudRecording) {
    return '选择录制规则的命名空间和组。';
  }
  const docsLink =
    'https://www.smxyi.com/datav/alerting/fundamentals/annotation-label/variables-label-annotation';

  const textToRender =
    ruleType === RuleFormType.grafana
      ? ` ${annotationsText} `
      : ruleType === RuleFormType.cloudAlerting
      ? `选择警报的命名空间和评估组。 ${annotationsText} `
      : '';

  return (
    <Stack gap={0.5}>
      {`${textToRender}`}
      <NeedHelpInfo
        contentText={`注解添加元数据以在警报通知中提供有关警报的详细信息。例如，添加摘要注解，告知哪个值导致警报触发或警报发生在哪个服务器上。注解可以包含文本和模板代码的组合。`}
        externalLink={docsLink}
        linkText={`阅读有关注解的信息`}
        title="注解"
      />
    </Stack>
  );
}

export function DetailsStep() {
  const { watch } = useFormContext<RuleFormValues & { location?: string }>();

  const styles = useStyles2(getStyles);

  const ruleFormType = watch('type');
  const dataSourceName = watch('dataSourceName');
  const type = watch('type');

  return (
    <RuleEditorSection
      stepNo={type === RuleFormType.cloudRecording ? 3 : 4}
      title={type === RuleFormType.cloudRecording ? '添加命名空间和组' : '添加注解'}
      description={getDescription(type, styles)}
    >
      {ruleFormType === RuleFormType.cloudRecording && dataSourceName && (
        <GroupAndNamespaceFields rulesSourceName={dataSourceName} />
      )}

      {type !== RuleFormType.cloudRecording && <AnnotationsField />}
    </RuleEditorSection>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  needHelpText: css`
    color: ${theme.colors.text.primary};
    font-size: ${theme.typography.size.sm};
    margin-bottom: ${theme.spacing(0.5)};
    cursor: pointer;
    text-underline-position: under;
  `,

  needHelpTooltip: css`
    max-width: 300px;
    font-size: ${theme.typography.size.sm};
    margin-left: 5px;

    div {
      margin-top: 5px;
      margin-bottom: 5px;
    }
  `,

  tooltipHeader: css`
    color: ${theme.colors.text.primary};
    font-weight: bold;
  `,

  tooltipLink: css`
    color: ${theme.colors.text.link};
    cursor: pointer;

    &:hover {
      text-decoration: underline;
    }
  `,

  underline: css`
    text-decoration: underline;
  `,
});
