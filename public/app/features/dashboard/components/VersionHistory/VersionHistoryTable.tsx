import { css } from '@emotion/css';
import React from 'react';

import { Checkbox, Button, Tag, ModalsController } from '@grafana/ui';

import { DecoratedRevisionModel } from '../DashboardSettings/VersionsSettings';

import { RevertDashboardModal } from './RevertDashboardModal';

type VersionsTableProps = {
  versions: DecoratedRevisionModel[];
  canCompare: boolean;
  onCheck: (ev: React.FormEvent<HTMLInputElement>, versionId: number) => void;
};

export const VersionHistoryTable = ({ versions, canCompare, onCheck }: VersionsTableProps) => (
  <table className="filter-table gf-form-group">
    <thead>
      <tr>
        <th className="width-4"></th>
        <th className="width-4">版本</th>
        <th className="width-14">日期</th>
        <th className="width-10">操作用户</th>
        <th>备注</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      {versions.map((version, idx) => (
        <tr key={version.id}>
          <td>
            <Checkbox
              aria-label={`Toggle selection of version ${version.version}`}
              className={css`
                display: inline;
              `}
              checked={version.checked}
              onChange={(ev) => onCheck(ev, version.id)}
              disabled={!version.checked && canCompare}
            />
          </td>
          <td>{version.version}</td>
          <td>{version.createdDateString}</td>
          <td>{version.createdBy}</td>
          <td>{version.message}</td>
          <td className="text-right">
            {idx === 0 ? (
              <Tag name="最新版本" colorIndex={17} />
            ) : (
              <ModalsController>
                {({ showModal, hideModal }) => (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon="history"
                    onClick={() => {
                      showModal(RevertDashboardModal, {
                        version: version.version,
                        hideModal,
                      });
                    }}
                  >
                    恢复
                  </Button>
                )}
              </ModalsController>
            )}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);
