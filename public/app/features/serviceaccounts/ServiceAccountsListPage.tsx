import { css, cx } from '@emotion/css';
import pluralize from 'pluralize';
import React, { useEffect, useState } from 'react';
import { connect, ConnectedProps } from 'react-redux';

import { GrafanaTheme2, OrgRole } from '@grafana/data';
import { ConfirmModal, FilterInput, LinkButton, RadioButtonGroup, useStyles2, InlineField } from '@grafana/ui';
import EmptyListCTA from 'app/core/components/EmptyListCTA/EmptyListCTA';
import { Page } from 'app/core/components/Page/Page';
import PageLoader from 'app/core/components/PageLoader/PageLoader';
import { contextSrv } from 'app/core/core';
import { StoreState, ServiceAccountDTO, AccessControlAction, ServiceAccountStateFilter } from 'app/types';

import { CreateTokenModal, ServiceAccountToken } from './components/CreateTokenModal';
import ServiceAccountListItem from './components/ServiceAccountsListItem';
import {
  changeQuery,
  fetchACOptions,
  fetchServiceAccounts,
  deleteServiceAccount,
  updateServiceAccount,
  changeStateFilter,
  createServiceAccountToken,
} from './state/actions';

interface OwnProps {}

export type Props = OwnProps & ConnectedProps<typeof connector>;

function mapStateToProps(state: StoreState) {
  return {
    ...state.serviceAccounts,
  };
}

const mapDispatchToProps = {
  changeQuery,
  fetchACOptions,
  fetchServiceAccounts,
  deleteServiceAccount,
  updateServiceAccount,
  changeStateFilter,
  createServiceAccountToken,
};

const connector = connect(mapStateToProps, mapDispatchToProps);

export const ServiceAccountsListPageUnconnected = ({
  serviceAccounts,
  isLoading,
  roleOptions,
  query,
  serviceAccountStateFilter,
  changeQuery,
  fetchACOptions,
  fetchServiceAccounts,
  deleteServiceAccount,
  updateServiceAccount,
  changeStateFilter,
  createServiceAccountToken,
}: Props): JSX.Element => {
  const styles = useStyles2(getStyles);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [isDisableModalOpen, setIsDisableModalOpen] = useState(false);
  const [newToken, setNewToken] = useState('');
  const [currentServiceAccount, setCurrentServiceAccount] = useState<ServiceAccountDTO | null>(null);

  useEffect(() => {
    fetchServiceAccounts({ withLoadingIndicator: true });
    if (contextSrv.licensedAccessControlEnabled()) {
      fetchACOptions();
    }
  }, [fetchACOptions, fetchServiceAccounts]);

  const noServiceAccountsCreated =
    serviceAccounts.length === 0 && serviceAccountStateFilter === ServiceAccountStateFilter.All && !query;

  const onRoleChange = async (role: OrgRole, serviceAccount: ServiceAccountDTO) => {
    const updatedServiceAccount = { ...serviceAccount, role: role };
    updateServiceAccount(updatedServiceAccount);
    if (contextSrv.licensedAccessControlEnabled()) {
      fetchACOptions();
    }
  };

  const onQueryChange = (value: string) => {
    changeQuery(value);
  };

  const onStateFilterChange = (value: ServiceAccountStateFilter) => {
    changeStateFilter(value);
  };

  const onRemoveButtonClick = (serviceAccount: ServiceAccountDTO) => {
    setCurrentServiceAccount(serviceAccount);
    setIsRemoveModalOpen(true);
  };

  const onServiceAccountRemove = async () => {
    if (currentServiceAccount) {
      deleteServiceAccount(currentServiceAccount.id);
    }
    onRemoveModalClose();
  };

  const onDisableButtonClick = (serviceAccount: ServiceAccountDTO) => {
    setCurrentServiceAccount(serviceAccount);
    setIsDisableModalOpen(true);
  };

  const onDisable = () => {
    if (currentServiceAccount) {
      updateServiceAccount({ ...currentServiceAccount, isDisabled: true });
    }
    onDisableModalClose();
  };

  const onEnable = (serviceAccount: ServiceAccountDTO) => {
    updateServiceAccount({ ...serviceAccount, isDisabled: false });
  };

  const onTokenAdd = (serviceAccount: ServiceAccountDTO) => {
    setCurrentServiceAccount(serviceAccount);
    setIsAddModalOpen(true);
  };

  const onTokenCreate = async (token: ServiceAccountToken) => {
    if (currentServiceAccount) {
      createServiceAccountToken(currentServiceAccount.id, token, setNewToken);
    }
  };

  const onAddModalClose = () => {
    setIsAddModalOpen(false);
    setCurrentServiceAccount(null);
    setNewToken('');
  };

  const onRemoveModalClose = () => {
    setIsRemoveModalOpen(false);
    setCurrentServiceAccount(null);
  };

  const onDisableModalClose = () => {
    setIsDisableModalOpen(false);
    setCurrentServiceAccount(null);
  };

  const docsLink = (
    <a
      className="external-link"
      href="http://www.smxyi.com/datav"
      target="_blank"
      rel="noopener noreferrer"
    >
      文档.
    </a>
  );
  const subTitle = (
    <span>
    服务帐户及其令牌可用于针对系统API进行身份验证。在我们的{' '}
      {docsLink}
    </span>
  );

  return (
    <Page navId="serviceaccounts" subTitle={subTitle}>
      <Page.Contents>
        <div className="page-action-bar">
          <InlineField grow>
            <FilterInput
              placeholder="按名称搜索服务帐户"
              value={query}
              onChange={onQueryChange}
              width={50}
            />
          </InlineField>
          <RadioButtonGroup
            options={[
              { label: '所有', value: ServiceAccountStateFilter.All },
              { label: '带令牌过期', value: ServiceAccountStateFilter.WithExpiredTokens },
              { label: '禁用', value: ServiceAccountStateFilter.Disabled },
            ]}
            onChange={onStateFilterChange}
            value={serviceAccountStateFilter}
            className={styles.filter}
          />
          {!noServiceAccountsCreated && contextSrv.hasPermission(AccessControlAction.ServiceAccountsCreate) && (
            <LinkButton href="org/serviceaccounts/create" variant="primary">
              添加服务帐户
            </LinkButton>
          )}
        </div>
        {isLoading && <PageLoader />}
        {!isLoading && noServiceAccountsCreated && (
          <>
            <EmptyListCTA
              title="您尚未创建任何服务帐户。"
              buttonIcon="key-skeleton-alt"
              buttonLink="org/serviceaccounts/create"
              buttonTitle="添加服务帐户"
              buttonDisabled={!contextSrv.hasPermission(AccessControlAction.ServiceAccountsCreate)}
              proTip="请记住，您可以为对其他应用程序的 API 访问提供特定权限。"
              proTipLink=""
              proTipLinkTitle=""
              proTipTarget="_blank"
            />
          </>
        )}

        {!isLoading && serviceAccounts.length !== 0 && (
          <>
            <div className={cx(styles.table, 'admin-list-table')}>
              <table className="filter-table filter-table--hover">
                <thead>
                  <tr>
                    <th></th>
                    <th>账号</th>
                    <th>ID</th>
                    <th>角色</th>
                    <th>令牌</th>
                    <th style={{ width: '34px' }} />
                  </tr>
                </thead>
                <tbody>
                  {serviceAccounts.map((serviceAccount: ServiceAccountDTO) => (
                    <ServiceAccountListItem
                      serviceAccount={serviceAccount}
                      key={serviceAccount.id}
                      roleOptions={roleOptions}
                      onRoleChange={onRoleChange}
                      onRemoveButtonClick={onRemoveButtonClick}
                      onDisable={onDisableButtonClick}
                      onEnable={onEnable}
                      onAddTokenClick={onTokenAdd}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        {currentServiceAccount && (
          <>
            <ConfirmModal
              isOpen={isRemoveModalOpen}
              body={`是否确实要删除'${currentServiceAccount.name}'${
                !!currentServiceAccount.tokens
                  ? ` 和相应的${currentServiceAccount.tokens} ${pluralize(
                      '个令牌吗?',
                      currentServiceAccount.tokens
                    )}`
                  : ''
              }?`}
              confirmText="确定"
              title="删除服务帐户"
              onConfirm={onServiceAccountRemove}
              onDismiss={onRemoveModalClose}
            />
            <ConfirmModal
              isOpen={isDisableModalOpen}
              title="禁用服务帐户"
              body={`是否确实要禁用 '${currentServiceAccount.name}'?`}
              confirmText="禁用服务帐户"
              onConfirm={onDisable}
              onDismiss={onDisableModalClose}
            />
            <CreateTokenModal
              isOpen={isAddModalOpen}
              token={newToken}
              serviceAccountLogin={currentServiceAccount.login}
              onCreateToken={onTokenCreate}
              onClose={onAddModalClose}
            />
          </>
        )}
      </Page.Contents>
    </Page>
  );
};

export const getStyles = (theme: GrafanaTheme2) => {
  return {
    table: css`
      margin-top: ${theme.spacing(3)};
    `,
    filter: css`
      margin: 0 ${theme.spacing(1)};
    `,
    row: css`
      display: flex;
      align-items: center;
      height: 100% !important;

      a {
        padding: ${theme.spacing(0.5)} 0 !important;
      }
    `,
    unitTooltip: css`
      display: flex;
      flex-direction: column;
    `,
    unitItem: css`
      cursor: pointer;
      padding: ${theme.spacing(0.5)} 0;
      margin-right: ${theme.spacing(1)};
    `,
    disabled: css`
      color: ${theme.colors.text.disabled};
    `,
    link: css`
      color: inherit;
      cursor: pointer;
      text-decoration: underline;
    `,
    pageHeader: css`
      display: flex;
      margin-bottom: ${theme.spacing(2)};
    `,
    apiKeyInfoLabel: css`
      margin-left: ${theme.spacing(1)};
      line-height: 2.2;
      flex-grow: 1;
      color: ${theme.colors.text.secondary};

      span {
        padding: ${theme.spacing(0.5)};
      }
    `,
    filterDelimiter: css`
      flex-grow: 1;
    `,
  };
};

const ServiceAccountsListPage = connector(ServiceAccountsListPageUnconnected);
export default ServiceAccountsListPage;
