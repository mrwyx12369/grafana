import pluralize from 'pluralize';
import React, { useMemo, useState } from 'react';

import { dateTime, dateTimeFormat } from '@grafana/data';
import { Stack } from '@grafana/experimental';
import { Badge, Button, ConfirmModal, Icon, Modal, useStyles2 } from '@grafana/ui';
import { contextSrv } from 'app/core/services/context_srv';
import { AlertManagerCortexConfig } from 'app/plugins/datasource/alertmanager/types';
import { AccessControlAction, ContactPointsState, NotifiersState, ReceiversState, useDispatch } from 'app/types';

import { isOrgAdmin } from '../../../../plugins/admin/permissions';
import { useGetContactPointsState } from '../../api/receiversApi';
import { Authorize } from '../../components/Authorize';
import { useUnifiedAlertingSelector } from '../../hooks/useUnifiedAlertingSelector';
import { deleteReceiverAction } from '../../state/actions';
import { getAlertTableStyles } from '../../styles/table';
import { SupportedPlugin } from '../../types/pluginBridges';
import { getNotificationsPermissions } from '../../utils/access-control';
import { isReceiverUsed } from '../../utils/alertmanager';
import { GRAFANA_RULES_SOURCE_NAME, isVanillaPrometheusAlertManagerDataSource } from '../../utils/datasource';
import { makeAMLink } from '../../utils/misc';
import { extractNotifierTypeCounts } from '../../utils/receivers';
import { createUrl } from '../../utils/url';
import { DynamicTable, DynamicTableColumnProps, DynamicTableItemProps } from '../DynamicTable';
import { ProvisioningBadge } from '../Provisioning';
import { ActionIcon } from '../rules/ActionIcon';

import { ReceiversSection } from './ReceiversSection';
import { GrafanaAppBadge } from './grafanaAppReceivers/GrafanaAppBadge';
import { useGetReceiversWithGrafanaAppTypes } from './grafanaAppReceivers/grafanaApp';
import { ReceiverWithTypes } from './grafanaAppReceivers/types';
import { AlertmanagerConfigHealth, useAlertmanagerConfigHealth } from './useAlertmanagerConfigHealth';

interface UpdateActionProps extends ActionProps {
  onClickDeleteReceiver: (receiverName: string) => void;
}

function UpdateActions({ permissions, alertManagerName, receiverName, onClickDeleteReceiver }: UpdateActionProps) {
  return (
    <>
      <Authorize actions={[permissions.update]}>
        <ActionIcon
          aria-label="Edit"
          data-testid="edit"
          to={makeAMLink(
            `/alerting/notifications/receivers/${encodeURIComponent(receiverName)}/edit`,
            alertManagerName
          )}
          tooltip="Edit contact point"
          icon="pen"
        />
      </Authorize>
      <Authorize actions={[permissions.delete]}>
        <ActionIcon
          onClick={() => onClickDeleteReceiver(receiverName)}
          tooltip="Delete contact point"
          icon="trash-alt"
        />
      </Authorize>
    </>
  );
}

interface ActionProps {
  permissions: {
    read: AccessControlAction;
    create: AccessControlAction;
    update: AccessControlAction;
    delete: AccessControlAction;
    provisioning: {
      read: AccessControlAction;
      readSecrets: AccessControlAction;
    };
  };
  alertManagerName: string;
  receiverName: string;
}

function ViewAction({ permissions, alertManagerName, receiverName }: ActionProps) {
  return (
    <Authorize actions={[permissions.update]}>
      <ActionIcon
        data-testid="view"
        to={makeAMLink(`/alerting/notifications/receivers/${encodeURIComponent(receiverName)}/edit`, alertManagerName)}
        tooltip="View contact point"
        icon="file-alt"
      />
    </Authorize>
  );
}

function ExportAction({ permissions, receiverName }: ActionProps) {
  const canReadSecrets = contextSrv.hasAccess(permissions.provisioning.readSecrets, isOrgAdmin());
  return (
    <Authorize actions={[permissions.provisioning.read, permissions.provisioning.readSecrets]}>
      <ActionIcon
        data-testid="export"
        to={createUrl(`/api/v1/provisioning/contact-points/export/`, {
          download: 'true',
          format: 'yaml',
          decrypt: canReadSecrets.toString(),
          name: receiverName,
        })}
        tooltip={
          canReadSecrets ? 'Export contact point with decrypted secrets' : 'Export contact point with redacted secrets'
        }
        icon="download-alt"
        target="_blank"
      />
    </Authorize>
  );
}

interface ReceiverErrorProps {
  errorCount: number;
  errorDetail?: string;
  showErrorCount: boolean;
  tooltip?: string;
}

function ReceiverError({ errorCount, errorDetail, showErrorCount, tooltip }: ReceiverErrorProps) {
  const text = showErrorCount ? `${errorCount} ${pluralize('error', errorCount)}` : 'Error';
  const tooltipToRender = tooltip ?? errorDetail ?? 'Error';

  return <Badge color="red" icon="exclamation-circle" text={text} tooltip={tooltipToRender} />;
}

interface NotifierHealthProps {
  errorsByNotifier: number;
  errorDetail?: string;
  lastNotify: string;
}

function NotifierHealth({ errorsByNotifier, errorDetail, lastNotify }: NotifierHealthProps) {
  const hasErrors = errorsByNotifier > 0;
  const noAttempts = isLastNotifyNullDate(lastNotify);

  if (hasErrors) {
    return <ReceiverError errorCount={errorsByNotifier} errorDetail={errorDetail} showErrorCount={false} />;
  }

  if (noAttempts) {
    return <>No attempts</>;
  }

  return <Badge color="green" text="OK" />;
}

interface ReceiverHealthProps {
  errorsByReceiver: number;
  someWithNoAttempt: boolean;
}

function ReceiverHealth({ errorsByReceiver, someWithNoAttempt }: ReceiverHealthProps) {
  const hasErrors = errorsByReceiver > 0;

  if (hasErrors) {
    return (
      <ReceiverError
        errorCount={errorsByReceiver}
        showErrorCount={true}
        tooltip="Expand the contact point to see error details."
      />
    );
  }

  if (someWithNoAttempt) {
    return <>No attempts</>;
  }

  return <Badge color="green" text="OK" />;
}

const useContactPointsState = (alertManagerName: string) => {
  const contactPointsState = useGetContactPointsState(alertManagerName);
  const receivers: ReceiversState = contactPointsState?.receivers ?? {};
  const errorStateAvailable = Object.keys(receivers).length > 0;
  return { contactPointsState, errorStateAvailable };
};

interface ReceiverItem {
  name: string;
  types: string[];
  provisioned?: boolean;
  grafanaAppReceiverType?: SupportedPlugin;
}

interface NotifierStatus {
  lastError?: null | string;
  lastNotify: string;
  lastNotifyDuration: string;
  type: string;
  sendResolved?: boolean;
}

type RowTableColumnProps = DynamicTableColumnProps<ReceiverItem>;
type RowItemTableProps = DynamicTableItemProps<ReceiverItem>;

type NotifierTableColumnProps = DynamicTableColumnProps<NotifierStatus>;
type NotifierItemTableProps = DynamicTableItemProps<NotifierStatus>;

interface NotifiersTableProps {
  notifiersState: NotifiersState;
}

const isLastNotifyNullDate = (lastNotify: string) => lastNotify === '0001-01-01T00:00:00.000Z';

function LastNotify({ lastNotifyDate }: { lastNotifyDate: string }) {
  if (isLastNotifyNullDate(lastNotifyDate)) {
    return <>{'-'}</>;
  } else {
    return (
      <Stack alignItems="center">
        <div>{`${dateTime(lastNotifyDate).locale('zh').fromNow(true)} 之前`}</div>
        <Icon name="clock-nine" />
        <div>{`${dateTimeFormat(lastNotifyDate, { format: 'YYYY-MM-DD HH:mm:ss' })}`}</div>
      </Stack>
    );
  }
}

const possibleNullDurations = ['', '0', '0ms', '0s', '0m', '0h', '0d', '0w', '0y'];
const durationIsNull = (duration: string) => possibleNullDurations.includes(duration);

function NotifiersTable({ notifiersState }: NotifiersTableProps) {
  function getNotifierColumns(): NotifierTableColumnProps[] {
    return [
      {
        id: 'health',
        label: '健康状态',
        renderCell: ({ data: { lastError, lastNotify } }) => {
          return (
            <NotifierHealth
              errorsByNotifier={lastError ? 1 : 0}
              errorDetail={lastError ?? undefined}
              lastNotify={lastNotify}
            />
          );
        },
        size: 0.5,
      },
      {
        id: 'name',
        label: '名称',
        renderCell: ({ data: { type }, id }) => <>{`${type}[${id}]`}</>,
        size: 1,
      },
      {
        id: 'lastNotify',
        label: '上次传递尝试',
        renderCell: ({ data: { lastNotify } }) => <LastNotify lastNotifyDate={lastNotify} />,
        size: 3,
      },
      {
        id: 'lastNotifyDuration',
        label: '上次持续时间',
        renderCell: ({ data: { lastNotify, lastNotifyDuration } }) => (
          <>{isLastNotifyNullDate(lastNotify) && durationIsNull(lastNotifyDuration) ? '-' : lastNotifyDuration}</>
        ),
        size: 1,
      },
      {
        id: 'sendResolved',
        label: '发送已解决',
        renderCell: ({ data: { sendResolved } }) => <>{String(Boolean(sendResolved))}</>,
        size: 1,
      },
    ];
  }

  const notifierRows: NotifierItemTableProps[] = Object.entries(notifiersState).flatMap((typeState) =>
    typeState[1].map((notifierStatus, index) => {
      return {
        id: index,
        data: {
          type: typeState[0],
          lastError: notifierStatus.lastNotifyAttemptError,
          lastNotify: notifierStatus.lastNotifyAttempt,
          lastNotifyDuration: notifierStatus.lastNotifyAttemptDuration,
          sendResolved: notifierStatus.sendResolved,
        },
      };
    })
  );

  return <DynamicTable items={notifierRows} cols={getNotifierColumns()} />;
}

interface Props {
  config: AlertManagerCortexConfig;
  alertManagerName: string;
}

export const ReceiversTable = ({ config, alertManagerName }: Props) => {
  const dispatch = useDispatch();
  const isVanillaAM = isVanillaPrometheusAlertManagerDataSource(alertManagerName);
  const permissions = getNotificationsPermissions(alertManagerName);
  const grafanaNotifiers = useUnifiedAlertingSelector((state) => state.grafanaNotifiers);

  const configHealth = useAlertmanagerConfigHealth(config.alertmanager_config);
  const { contactPointsState, errorStateAvailable } = useContactPointsState(alertManagerName);

  // receiver name slated for deletion. If this is set, a confirmation modal is shown. If user approves, this receiver is deleted
  const [receiverToDelete, setReceiverToDelete] = useState<string>();
  const [showCannotDeleteReceiverModal, setShowCannotDeleteReceiverModal] = useState(false);

  const isGrafanaAM = alertManagerName === GRAFANA_RULES_SOURCE_NAME;
  const showExport =
    isGrafanaAM &&
    (contextSrv.hasAccess(permissions.provisioning.read, isOrgAdmin()) ||
      contextSrv.hasAccess(permissions.provisioning.readSecrets, isOrgAdmin()));

  const onClickDeleteReceiver = (receiverName: string): void => {
    if (isReceiverUsed(receiverName, config)) {
      setShowCannotDeleteReceiverModal(true);
    } else {
      setReceiverToDelete(receiverName);
    }
  };

  const deleteReceiver = () => {
    if (receiverToDelete) {
      dispatch(deleteReceiverAction(receiverToDelete, alertManagerName));
    }
    setReceiverToDelete(undefined);
  };

  const receivers = useGetReceiversWithGrafanaAppTypes(config.alertmanager_config.receivers ?? []);
  const rows: RowItemTableProps[] = useMemo(() => {
    return (
      receivers?.map((receiver: ReceiverWithTypes) => ({
        id: receiver.name,
        data: {
          name: receiver.name,
          types: Object.entries(extractNotifierTypeCounts(receiver, grafanaNotifiers.result ?? [])).map(
            ([type, count]) => {
              if (count > 1) {
                return `${type} (${count})`;
              }
              return type;
            }
          ),
          grafanaAppReceiverType: receiver.grafanaAppReceiverType,
          provisioned: receiver.grafana_managed_receiver_configs?.some((receiver) => receiver.provenance),
        },
      })) ?? []
    );
  }, [grafanaNotifiers.result, receivers]);

  const columns = useGetColumns(
    alertManagerName,
    errorStateAvailable,
    contactPointsState,
    configHealth,
    onClickDeleteReceiver,
    permissions,
    isVanillaAM
  );

  return (
    <ReceiversSection
      title="联系点"
      description="定义通知的发送位置，例如电子邮件或QQ、微信。"
      showButton={!isVanillaAM && contextSrv.hasPermission(permissions.create)}
      addButtonLabel={'添加联系点'}
      addButtonTo={makeAMLink('/alerting/notifications/receivers/new', alertManagerName)}
      exportLink={
        showExport
          ? createUrl('/api/v1/provisioning/contact-points/export', {
              download: 'true',
              format: 'yaml',
              decrypt: isOrgAdmin().toString(),
            })
          : undefined
      }
    >
      <DynamicTable
        items={rows}
        cols={columns}
        isExpandable={errorStateAvailable}
        renderExpandedContent={
          errorStateAvailable
            ? ({ data: { name } }) => (
                <NotifiersTable notifiersState={contactPointsState?.receivers[name]?.notifiers ?? {}} />
              )
            : undefined
        }
      />
      {!!showCannotDeleteReceiverModal && (
        <Modal
          isOpen={true}
          title="无法删除联系点"
          onDismiss={() => setShowCannotDeleteReceiverModal(false)}
        >
          <p>
            无法删除联系点，因为它在更多策略中使用。请先更新或删除这些政策.
          </p>
          <Modal.ButtonRow>
            <Button variant="secondary" onClick={() => setShowCannotDeleteReceiverModal(false)} fill="outline">
              选择
            </Button>
          </Modal.ButtonRow>
        </Modal>
      )}
      {!!receiverToDelete && (
        <ConfirmModal
          isOpen={true}
          title="删除联系点"
          body={`是否确实要删除联系点 "${receiverToDelete}"?`}
          confirmText="确定"
          onConfirm={deleteReceiver}
          onDismiss={() => setReceiverToDelete(undefined)}
        />
      )}
    </ReceiversSection>
  );
};
const errorsByReceiver = (contactPointsState: ContactPointsState, receiverName: string) =>
  contactPointsState?.receivers[receiverName]?.errorCount ?? 0;

const someNotifiersWithNoAttempt = (contactPointsState: ContactPointsState, receiverName: string) => {
  const notifiers = Object.values(contactPointsState?.receivers[receiverName]?.notifiers ?? {});

  if (notifiers.length === 0) {
    return false;
  }

  const hasSomeWitNoAttempt = notifiers.flat().some((status) => isLastNotifyNullDate(status.lastNotifyAttempt));
  return hasSomeWitNoAttempt;
};

function useGetColumns(
  alertManagerName: string,
  errorStateAvailable: boolean,
  contactPointsState: ContactPointsState | undefined,
  configHealth: AlertmanagerConfigHealth,
  onClickDeleteReceiver: (receiverName: string) => void,
  permissions: {
    read: AccessControlAction;
    create: AccessControlAction;
    update: AccessControlAction;
    delete: AccessControlAction;
    provisioning: {
      read: AccessControlAction;
      readSecrets: AccessControlAction;
    };
  },
  isVanillaAM: boolean
): RowTableColumnProps[] {
  const tableStyles = useStyles2(getAlertTableStyles);

  const enableHealthColumn =
    errorStateAvailable || Object.values(configHealth.contactPoints).some((cp) => cp.matchingRoutes === 0);

  const isGrafanaAlertManager = alertManagerName === GRAFANA_RULES_SOURCE_NAME;

  const baseColumns: RowTableColumnProps[] = [
    {
      id: 'name',
      label: '联系点名称',
      renderCell: ({ data: { name, provisioned } }) => (
        <>
          <div>{name}</div>
          {provisioned && <ProvisioningBadge />}
        </>
      ),
      size: 3,
      className: tableStyles.nameCell,
    },
    {
      id: 'type',
      label: '联系点类型',
      renderCell: ({ data: { types, grafanaAppReceiverType } }) => (
        <>{grafanaAppReceiverType ? <GrafanaAppBadge grafanaAppType={grafanaAppReceiverType} /> : types.join(', ')}</>
      ),
      size: 2,
    },
  ];
  const healthColumn: RowTableColumnProps = {
    id: 'health',
    label: '健康状态',
    renderCell: ({ data: { name } }) => {
      if (configHealth.contactPoints[name]?.matchingRoutes === 0) {
        return <UnusedContactPointBadge />;
      }

      return (
        contactPointsState &&
        Object.entries(contactPointsState.receivers).length > 0 && (
          <ReceiverHealth
            errorsByReceiver={errorsByReceiver(contactPointsState, name)}
            someWithNoAttempt={someNotifiersWithNoAttempt(contactPointsState, name)}
          />
        )
      );
    },
    size: '160px',
  };

  return [
    ...baseColumns,
    ...(enableHealthColumn ? [healthColumn] : []),
    {
      id: 'actions',
      label: '操作',
      renderCell: ({ data: { provisioned, name } }) => (
        <Authorize
          actions={[
            permissions.update,
            permissions.delete,
            permissions.provisioning.read,
            permissions.provisioning.readSecrets,
          ]}
          fallback={isOrgAdmin()}
        >
          <div className={tableStyles.actionsCell}>
            {!isVanillaAM && !provisioned && (
              <UpdateActions
                permissions={permissions}
                alertManagerName={alertManagerName}
                receiverName={name}
                onClickDeleteReceiver={onClickDeleteReceiver}
              />
            )}
            {(isVanillaAM || provisioned) && (
              <ViewAction permissions={permissions} alertManagerName={alertManagerName} receiverName={name} />
            )}
            {isGrafanaAlertManager && (
              <ExportAction permissions={permissions} alertManagerName={alertManagerName} receiverName={name} />
            )}
          </div>
        </Authorize>
      ),
      size: '100px',
    },
  ];
}

function UnusedContactPointBadge() {
  return (
    <Badge
      text="未使用"
      color="orange"
      icon="exclamation-triangle"
      tooltip="此联系点未在任何通知策略中使用，也不会收到任何警报"
    />
  );
}
