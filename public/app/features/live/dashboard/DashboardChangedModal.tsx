import { css } from '@emotion/css';
import React from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { locationService } from '@grafana/runtime';
import { Button, Modal, stylesFactory, useStyles2 } from '@grafana/ui';

import { dashboardWatcher } from './dashboardWatcher';
import { DashboardEvent, DashboardEventAction } from './types';

interface Props {
  event?: DashboardEvent;
  onDismiss: () => void;
}

export function DashboardChangedModal({ onDismiss, event }: Props) {
  const styles = useStyles2(getStyles);

  const onDiscardChanges = () => {
    if (event?.action === DashboardEventAction.Deleted) {
      locationService.push('/');
      return;
    }

    dashboardWatcher.reloadPage();
    onDismiss();
  };

  return (
    <Modal
      isOpen={true}
      title="仪表板已更改"
      icon="copy"
      onDismiss={onDismiss}
      onClickBackdrop={() => {}}
      className={styles.modal}
    >
      <div className={styles.description}>
      仪表板已由另一个会话更新。是要继续编辑还是放弃本地更改？
      </div>
      <Modal.ButtonRow>
        <Button onClick={onDismiss} variant="secondary" fill="outline">
         继续编辑
        </Button>
        <Button onClick={onDiscardChanges} variant="destructive">
         放弃本地更改
        </Button>
      </Modal.ButtonRow>
    </Modal>
  );
}

const getStyles = stylesFactory((theme: GrafanaTheme2) => {
  return {
    modal: css({ width: '600px' }),
    description: css({
      color: theme.colors.text.secondary,
      paddingBottom: theme.spacing(1),
    }),
  };
});
