import React, { useState } from 'react';

import { Button, ConfirmModal } from '@grafana/ui';
import { contextSrv } from 'app/core/core';
import { AccessControlAction, Organization } from 'app/types';

interface Props {
  orgs: Organization[];
  onDelete: (orgId: number) => void;
}

export function AdminOrgsTable({ orgs, onDelete }: Props) {
  const canDeleteOrgs = contextSrv.hasPermission(AccessControlAction.OrgsDelete);

  const [deleteOrg, setDeleteOrg] = useState<Organization>();
  return (
    <table className="filter-table form-inline filter-table--hover">
      <thead>
        <tr>
          <th>ID标识</th>
          <th>机构名称</th>
          <th style={{ width: '1%' }}></th>
        </tr>
      </thead>
      <tbody>
        {orgs.map((org) => (
          <tr key={`${org.id}-${org.name}`}>
            <td className="link-td">
              <a href={`admin/orgs/edit/${org.id}`}>{org.id}</a>
            </td>
            <td className="link-td">
              <a href={`admin/orgs/edit/${org.id}`}>{org.name}</a>
            </td>
            <td className="text-right">
              <Button
                variant="destructive"
                size="sm"
                icon="times"
                onClick={() => setDeleteOrg(org)}
                aria-label="Delete org"
                disabled={!canDeleteOrgs}
              />
            </td>
          </tr>
        ))}
      </tbody>
      {deleteOrg && (
        <ConfirmModal
          isOpen
          icon="trash-alt"
          title="删除"
          body={
            <div>
              是否确实要删除 &apos;{deleteOrg.name}&apos;?
              <br /> <small>此组织的所有仪表板都将被删除！</small>
            </div>
          }
          confirmText="删除"
          onDismiss={() => setDeleteOrg(undefined)}
          onConfirm={() => {
            onDelete(deleteOrg.id);
            setDeleteOrg(undefined);
          }}
        />
      )}
    </table>
  );
}
