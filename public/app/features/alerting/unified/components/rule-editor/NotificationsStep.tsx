import { css } from '@emotion/css';
import React from 'react';
import { useFormContext } from 'react-hook-form';

import { GrafanaTheme2 } from '@grafana/data';
import { Stack } from '@grafana/experimental';
import { Card, Icon, Link, useStyles2 } from '@grafana/ui';

import { RuleFormType, RuleFormValues } from '../../types/rule-form';
import { GRAFANA_RULES_SOURCE_NAME } from '../../utils/datasource';

import LabelsField from './LabelsField';
import { NeedHelpInfo } from './NeedHelpInfo';
import { RuleEditorSection } from './RuleEditorSection';
import { NotificationPreview } from './notificaton-preview/NotificationPreview';

type NotificationsStepProps = {
  alertUid?: string;
};
export const NotificationsStep = ({ alertUid }: NotificationsStepProps) => {
  const styles = useStyles2(getStyles);
  const { watch, getValues } = useFormContext<RuleFormValues & { location?: string }>();

  const [type, labels, queries, condition, folder, alertName] = watch([
    'type',
    'labels',
    'queries',
    'condition',
    'folder',
    'name',
  ]);

  const dataSourceName = watch('dataSourceName') ?? GRAFANA_RULES_SOURCE_NAME;
  const hasLabelsDefined = getNonEmptyLabels(getValues('labels')).length > 0;

  const shouldRenderPreview = Boolean(condition) && Boolean(folder) && type === RuleFormType.grafana;

  const NotificationsStepDescription = () => {
    return (
      <div className={styles.stepDescription}>
        <div>添加自定义标签以更改通知的路由方式。</div>

        <NeedHelpInfo
          contentText={
            <Stack gap={1}>
              <Stack direction="row" gap={0}>
                <>
                触发警报规则实例将根据匹配的标签路由到通知策略。所有警报规则和实例（无论其标签如何）都与默认通知策略匹配。如果有没有嵌套策略，或者没有与警报规则或警报实例中的标签匹配的嵌套策略，则默认通知策略是匹配策略。
                </>
                <a
                  href={`https://www.smxyi.com/datav/alerting/fundamentals/notification-policies/notifications/`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <div className={styles.infoLink}>
                    阅读有关通知路由的信息. <Icon name="external-link-alt" />
                  </div>
                </a>
              </Stack>
              <Stack direction="row" gap={0}>
                <>
                自定义标签会更改通知的递送方式。首先，将标签添加到警报规则，然后然后通过添加标签匹配器将它们连接到通知策略。
                </>
                <a
                  href={`https://grafana.com/docs/grafana/latest/alerting/fundamentals/annotation-label/`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <div className={styles.infoLink}>
                    阅读有关标签和注解的信息。 <Icon name="external-link-alt" />
                  </div>
                </a>
              </Stack>
            </Stack>
          }
          title="通知路由"
        />
      </div>
    );
  };

  return (
    <RuleEditorSection
      stepNo={type === RuleFormType.cloudRecording ? 4 : 5}
      title={type === RuleFormType.cloudRecording ? '添加标签' : '配置通知'}
      description={
        type === RuleFormType.cloudRecording ? (
          '添加标签以帮助您更好地管理录制规则'
        ) : (
          <NotificationsStepDescription />
        )
      }
    >
      <div className={styles.contentWrapper}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {!hasLabelsDefined && type !== RuleFormType.cloudRecording && (
            <Card className={styles.card}>
              <Card.Heading>默认策略</Card.Heading>
              <Card.Description>
              如果未找到其他匹配的策略，则所有警报实例都由默认策略处理。要查看并编辑默认策略，转到<Link href="/alerting/routes">通知策略</Link>
                &nbsp;或者，如果您使用的是预配，请联系您的管理员。
              </Card.Description>
            </Card>
          )}
          <LabelsField dataSourceName={dataSourceName} />
        </div>
      </div>
      {shouldRenderPreview &&
        condition &&
        folder && ( // need to check for condition and folder again because of typescript
          <NotificationPreview
            alertQueries={queries}
            customLabels={labels}
            condition={condition}
            folder={folder}
            alertName={alertName}
            alertUid={alertUid}
          />
        )}
    </RuleEditorSection>
  );
};

interface Label {
  key: string;
  value: string;
}

function getNonEmptyLabels(labels: Label[]) {
  return labels.filter((label) => label.key && label.value);
}

const getStyles = (theme: GrafanaTheme2) => ({
  contentWrapper: css`
    display: flex;
    align-items: center;
    margin-top: ${theme.spacing(2)};
  `,
  hideButton: css`
    color: ${theme.colors.text.secondary};
    cursor: pointer;
    margin-bottom: ${theme.spacing(1)};
  `,
  card: css`
    max-width: 500px;
  `,
  flowChart: css`
    margin-right: ${theme.spacing(3)};
  `,
  title: css`
    margin-bottom: ${theme.spacing(2)};
  `,
  stepDescription: css`
    margin-bottom: ${theme.spacing(2)};
    display: flex;
    gap: ${theme.spacing(1)};
)};
  `,
  infoLink: css`
    color: ${theme.colors.text.link};
  `,
});
