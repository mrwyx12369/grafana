import React, { useEffect } from 'react';
import useAsyncFn from 'react-use/lib/useAsyncFn';

import { getBackendSrv, isFetchError } from '@grafana/runtime';
import { LinkButton } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';
import { contextSrv } from 'app/core/services/context_srv';
import { AccessControlAction } from 'app/types';

import { AdminOrgsTable } from './AdminOrgsTable';

const deleteOrg = async (orgId: number) => {
  return await getBackendSrv().delete('/api/orgs/' + orgId);
};

const getOrgs = async () => {
  return await getBackendSrv().get('/api/orgs');
};

const getErrorMessage = (error: Error) => {
  return isFetchError(error) ? error?.data?.message : '发生意外错误。';
};

export default function AdminListOrgsPages() {
  const [state, fetchOrgs] = useAsyncFn(async () => await getOrgs(), []);
  const canCreateOrg = contextSrv.hasPermission(AccessControlAction.OrgsCreate);

  useEffect(() => {
    fetchOrgs();
  }, [fetchOrgs]);

  return (
    <Page navId="global-orgs">
      <Page.Contents>
        <>
          <div className="page-action-bar">
            <div className="page-action-bar__spacer" />
            <LinkButton icon="plus" href="org/new" disabled={!canCreateOrg}>
              新建组织机构
            </LinkButton>
          </div>
          {state.error && getErrorMessage(state.error)}
          {state.loading && 'Fetching organizations'}
          {state.value && (
            <AdminOrgsTable
              orgs={state.value}
              onDelete={(orgId) => {
                deleteOrg(orgId).then(() => fetchOrgs());
              }}
            />
          )}
        </>
      </Page.Contents>
    </Page>
  );
}
