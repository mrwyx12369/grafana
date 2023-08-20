import React, { useCallback, useState } from 'react';
import { useAsync, useDebounce } from 'react-use';

import { Button, Icon, Input, Modal, useStyles2 } from '@grafana/ui';

import { getConnectedDashboards } from '../../state/api';
import { getModalStyles } from '../../styles';
import { PanelModelWithLibraryPanel } from '../../types';
import { usePanelSave } from '../../utils/usePanelSave';

interface Props {
  panel: PanelModelWithLibraryPanel;
  folderUid: string;
  isUnsavedPrompt?: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
  onDiscard: () => void;
}

export const SaveLibraryPanelModal = ({
  panel,
  folderUid,
  isUnsavedPrompt,
  onDismiss,
  onConfirm,
  onDiscard,
}: Props) => {
  const [searchString, setSearchString] = useState('');
  const dashState = useAsync(async () => {
    const searchHits = await getConnectedDashboards(panel.libraryPanel.uid);
    if (searchHits.length > 0) {
      return searchHits.map((dash) => dash.title);
    }

    return [];
  }, [panel.libraryPanel.uid]);

  const [filteredDashboards, setFilteredDashboards] = useState<string[]>([]);
  useDebounce(
    () => {
      if (!dashState.value) {
        return setFilteredDashboards([]);
      }

      return setFilteredDashboards(
        dashState.value.filter((dashName) => dashName.toLowerCase().includes(searchString.toLowerCase()))
      );
    },
    300,
    [dashState.value, searchString]
  );

  const { saveLibraryPanel } = usePanelSave();
  const styles = useStyles2(getModalStyles);
  const discardAndClose = useCallback(() => {
    onDiscard();
  }, [onDiscard]);

  const title = isUnsavedPrompt ? '未保存的库面板更改' : '“存储库”面板';

  return (
    <Modal title={title} icon="save" onDismiss={onDismiss} isOpen={true}>
      <div>
        <p className={styles.textInfo}>
          {'This update will affect '}
          <strong>
            {panel.libraryPanel.meta?.connectedDashboards}{' '}
            {panel.libraryPanel.meta?.connectedDashboards === 1 ? '个仪表板' : '个仪表板'}.
          </strong>
          The following dashboards using the panel will be affected:
        </p>
        <Input
          className={styles.dashboardSearch}
          prefix={<Icon name="search" />}
          placeholder="搜索受影响的仪表板"
          value={searchString}
          onChange={(e) => setSearchString(e.currentTarget.value)}
        />
        {dashState.loading ? (
          <p>Loading connected dashboards...</p>
        ) : (
          <table className={styles.myTable}>
            <thead>
              <tr>
                <th>仪表板名称</th>
              </tr>
            </thead>
            <tbody>
              {filteredDashboards.map((dashName, i) => (
                <tr key={`dashrow-${i}`}>
                  <td>{dashName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Modal.ButtonRow>
          <Button variant="secondary" onClick={onDismiss} fill="outline">
            取消
          </Button>
          {isUnsavedPrompt && (
            <Button variant="destructive" onClick={discardAndClose}>
              丢弃
            </Button>
          )}
          <Button
            onClick={() => {
              saveLibraryPanel(panel, folderUid).then(() => {
                onConfirm();
              });
            }}
          >
            Update all
          </Button>
        </Modal.ButtonRow>
      </div>
    </Modal>
  );
};
