import { css } from '@emotion/css';
import { sumBy } from 'lodash';
import React from 'react';
import { connect, ConnectedProps } from 'react-redux';
import useAsyncFn from 'react-use/lib/useAsyncFn';

import { Modal, ConfirmModal, Button } from '@grafana/ui';
import { config } from 'app/core/config';
import { DashboardModel, PanelModel } from 'app/features/dashboard/state';
import { cleanUpDashboardAndVariables } from 'app/features/dashboard/state/actions';

import { useDashboardDelete } from './useDashboardDelete';

type DeleteDashboardModalProps = {
  hideModal(): void;
  dashboard: DashboardModel;
};

const mapDispatchToProps = {
  cleanUpDashboardAndVariables,
};

const connector = connect(null, mapDispatchToProps);

type Props = DeleteDashboardModalProps & ConnectedProps<typeof connector>;

const DeleteDashboardModalUnconnected = ({ hideModal, cleanUpDashboardAndVariables, dashboard }: Props) => {
  const isProvisioned = dashboard.meta.provisioned;
  const { onDeleteDashboard } = useDashboardDelete(dashboard.uid, cleanUpDashboardAndVariables);

  const [, onConfirm] = useAsyncFn(async () => {
    await onDeleteDashboard();
    hideModal();
  }, [hideModal]);

  const modalBody = getModalBody(dashboard.panels, dashboard.title);

  if (isProvisioned) {
    return <ProvisionedDeleteModal hideModal={hideModal} provisionedId={dashboard.meta.provisionedExternalId!} />;
  }

  return (
    <ConfirmModal
      isOpen={true}
      body={modalBody}
      onConfirm={onConfirm}
      onDismiss={hideModal}
      title="Delete"
      icon="trash-alt"
      confirmText="Delete"
    />
  );
};

const getModalBody = (panels: PanelModel[], title: string) => {
  const totalAlerts = sumBy(panels, (panel) => (panel.alert ? 1 : 0));
  return totalAlerts > 0 && !config.unifiedAlertingEnabled ? (
    <>
      <p>Do you want to delete this dashboard?</p>
      <p>
        This dashboard contains {totalAlerts} alert{totalAlerts > 1 ? 's' : ''}. Deleting this dashboard also deletes
        those alerts.
      </p>
    </>
  ) : (
    <>
      <p>Do you want to delete this dashboard?</p>
      <p>{title}</p>
    </>
  );
};

const ProvisionedDeleteModal = ({ hideModal, provisionedId }: { hideModal(): void; provisionedId: string }) => (
  <Modal
    isOpen={true}
    title="Cannot delete provisioned dashboard"
    icon="trash-alt"
    onDismiss={hideModal}
    className={css`
      width: 500px;
    `}
  >
    <p>
    此仪表板由 Grafana 预配管理，无法删除。从配置文件中删除仪表板以将其删除。
    </p>
    <p>
      <i>
        See{' '}
        <a
          className="external-link"
          href="https://www.smxyi.com/docs/datav/latest/administration/provisioning/#dashboards"
          target="_blank"
          rel="noreferrer"
        >
          文档
        </a>{' '}
        有关预配的详细信息。
      </i>
      <br />
      File path: {provisionedId}
    </p>
    <Modal.ButtonRow>
      <Button variant="primary" onClick={hideModal}>
        确定
      </Button>
    </Modal.ButtonRow>
  </Modal>
);

export const DeleteDashboardModal = connector(DeleteDashboardModalUnconnected);
