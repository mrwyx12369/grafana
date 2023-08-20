import { css, cx } from '@emotion/css';
import React, { ComponentType, useEffect, useMemo, memo } from 'react';
import { connect, ConnectedProps } from 'react-redux';

import { GrafanaTheme2 } from '@grafana/data';
import { selectors as e2eSelectors } from '@grafana/e2e-selectors/src';
import {
  Icon,
  IconName,
  LinkButton,
  Pagination,
  RadioButtonGroup,
  Tooltip,
  useStyles2,
  FilterInput,
} from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';
import { TagBadge } from 'app/core/components/TagFilter/TagBadge';
import { contextSrv } from 'app/core/core';

import PageLoader from '../../core/components/PageLoader/PageLoader';
import { AccessControlAction, StoreState, Unit, UserDTO, UserFilter } from '../../types';

import { changeFilter, changePage, changeQuery, fetchUsers } from './state/actions';

export interface FilterProps {
  filters: UserFilter[];
  onChange: (filter: UserFilter) => void;
  className?: string;
}
const extraFilters: Array<ComponentType<FilterProps>> = [];
export const addExtraFilters = (filter: ComponentType<FilterProps>) => {
  extraFilters.push(filter);
};

const selectors = e2eSelectors.pages.UserListPage.UserListAdminPage;

const mapDispatchToProps = {
  fetchUsers,
  changeQuery,
  changePage,
  changeFilter,
};

const mapStateToProps = (state: StoreState) => ({
  users: state.userListAdmin.users,
  query: state.userListAdmin.query,
  showPaging: state.userListAdmin.showPaging,
  totalPages: state.userListAdmin.totalPages,
  page: state.userListAdmin.page,
  filters: state.userListAdmin.filters,
  isLoading: state.userListAdmin.isLoading,
});

const connector = connect(mapStateToProps, mapDispatchToProps);

interface OwnProps {}

type Props = OwnProps & ConnectedProps<typeof connector>;

const UserListAdminPageUnConnected = ({
  fetchUsers,
  query,
  changeQuery,
  users,
  showPaging,
  totalPages,
  page,
  changePage,
  changeFilter,
  filters,
  isLoading,
}: Props) => {
  const styles = useStyles2(getStyles);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const showLicensedRole = useMemo(() => users.some((user) => user.licensedRole), [users]);

  return (
    <Page.Contents>
      <div className="page-action-bar" data-testid={selectors.container}>
        <div className="gf-form gf-form--grow">
          <FilterInput
            placeholder="按登录账号、电子邮件或姓名搜索用户。"
            autoFocus={true}
            value={query}
            onChange={changeQuery}
          />
          <RadioButtonGroup
            options={[
              { label: '所有用户', value: false },
              { label: '最近30天活跃户', value: true },
            ]}
            onChange={(value) => changeFilter({ name: 'activeLast30Days', value })}
            value={filters.find((f) => f.name === 'activeLast30Days')?.value}
            className={styles.filter}
          />
          {extraFilters.map((FilterComponent, index) => (
            <FilterComponent key={index} filters={filters} onChange={changeFilter} className={styles.filter} />
          ))}
        </div>
        {contextSrv.hasPermission(AccessControlAction.UsersCreate) && (
          <LinkButton href="admin/users/create" variant="primary">
            新建用户
          </LinkButton>
        )}
      </div>
      {isLoading ? (
        <PageLoader />
      ) : (
        <>
          <div className={cx(styles.table, 'admin-list-table')}>
            <table className="filter-table form-inline filter-table--hover">
              <thead>
                <tr>
                  <th></th>
                  <th>账号</th>
                  <th>邮件</th>
                  <th>姓名</th>
                  <th>所属机构</th>
                  {showLicensedRole && (
                    <th>
                      角色{' '}
                      <Tooltip
                        placement="top"
                        content={
                          <>
                              许可角色基于用户的组织角色 (i.e. 查看角色(Viewer), 编辑角色(Editor), 管理角色(Admin)和他们对仪表板/文件夹的访问权限.{' '}
                            <a
                              className={styles.link}
                              target="_blank"
                              rel="noreferrer noopener"
                              href={'http://www.smxyi.com/datav'}
                            >
                              详细
                            </a>
                          </>
                        }
                      >
                        <Icon name="question-circle" />
                      </Tooltip>
                    </th>
                  )}
                  <th>
                  上次活动时间&nbsp;
                    <Tooltip placement="top" content="自从看到用户使用系统以来的时间">
                      <Icon name="question-circle" />
                    </Tooltip>
                  </th>
                  <th style={{ width: '1%' }}>来自</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <UserListItem user={user} showLicensedRole={showLicensedRole} key={user.id} />
                ))}
              </tbody>
            </table>
          </div>
          {showPaging && <Pagination numberOfPages={totalPages} currentPage={page} onNavigate={changePage} />}
        </>
      )}
    </Page.Contents>
  );
};

export const UserListAdminPageContent = connector(UserListAdminPageUnConnected);
export function UserListAdminPage() {
  return (
    <Page navId="global-users">
      <UserListAdminPageContent />
    </Page>
  );
}

const getUsersAriaLabel = (name: string) => {
  return `Edit user's ${name} details`;
};

type UserListItemProps = {
  user: UserDTO;
  showLicensedRole: boolean;
};

const UserListItem = memo(({ user, showLicensedRole }: UserListItemProps) => {
  const styles = useStyles2(getStyles);
  const editUrl = `admin/users/edit/${user.id}`;

  return (
    <tr key={user.id}>
      <td className="width-4 text-center link-td">
        <a href={editUrl} aria-label={`Edit user's ${user.name} details`}>
          <img className="filter-table__avatar" src={user.avatarUrl} alt={`Avatar for user ${user.name}`} />
        </a>
      </td>
      <td className="link-td max-width-10">
        <a className="ellipsis" href={editUrl} title={user.login} aria-label={getUsersAriaLabel(user.name)}>
          {user.login}
        </a>
      </td>
      <td className="link-td max-width-10">
        <a className="ellipsis" href={editUrl} title={user.email} aria-label={getUsersAriaLabel(user.name)}>
          {user.email}
        </a>
      </td>
      <td className="link-td max-width-10">
        <a className="ellipsis" href={editUrl} title={user.name} aria-label={getUsersAriaLabel(user.name)}>
          {user.name}
        </a>
      </td>

      <td
        className={styles.row}
        title={
          user.orgs?.length
            ? `The user is a member of the following organizations: ${user.orgs.map((org) => org.name).join(',')}`
            : undefined
        }
      >
        <OrgUnits units={user.orgs} icon={'building'} />
        {user.isAdmin && (
          <a href={editUrl} aria-label={getUsersAriaLabel(user.name)}>
            <Tooltip placement="top" content="Grafana Admin">
              <Icon name="shield" />
            </Tooltip>
          </a>
        )}
      </td>
      {showLicensedRole && (
        <td className={cx('link-td', styles.iconRow)}>
          <a className="ellipsis" href={editUrl} title={user.name} aria-label={getUsersAriaLabel(user.name)}>
            {user.licensedRole === 'None' ? (
              <span className={styles.disabled}>
                Not assigned{' '}
                <Tooltip placement="top" content="A licensed role will be assigned when this user signs in">
                  <Icon name="question-circle" />
                </Tooltip>
              </span>
            ) : (
              user.licensedRole
            )}
          </a>
        </td>
      )}
      <td className="link-td">
        {user.lastSeenAtAge && (
          <a
            href={editUrl}
            aria-label={`Last seen at ${user.lastSeenAtAge}. Follow to edit user's ${user.name} details.`}
          >
            {user.lastSeenAtAge === '10 years' ? <span className={styles.disabled}>Never</span> : user.lastSeenAtAge}
          </a>
        )}
      </td>
      <td className="text-right">
        {Array.isArray(user.authLabels) && user.authLabels.length > 0 && (
          <TagBadge label={user.authLabels[0]} removeIcon={false} count={0} />
        )}
      </td>
      <td className="text-right">
        {user.isDisabled && <span className="label label-tag label-tag--gray">Disabled</span>}
      </td>
    </tr>
  );
});

UserListItem.displayName = 'UserListItem';

type OrgUnitProps = { units?: Unit[]; icon: IconName };

const OrgUnits = ({ units, icon }: OrgUnitProps) => {
  const styles = useStyles2(getStyles);

  if (!units?.length) {
    return null;
  }

  return units.length > 1 ? (
    <Tooltip
      placement={'top'}
      content={
        <div className={styles.unitTooltip}>
          {units?.map((unit) => (
            <a
              href={unit.url}
              className={styles.link}
              title={unit.name}
              key={unit.name}
              aria-label={`Edit ${unit.name}`}
            >
              {unit.name}
            </a>
          ))}
        </div>
      }
    >
      <div className={styles.unitItem}>
        <Icon name={icon} /> <span>{units.length}</span>
      </div>
    </Tooltip>
  ) : (
    <a
      href={units[0].url}
      className={styles.unitItem}
      title={units[0].name}
      key={units[0].name}
      aria-label={`Edit ${units[0].name}`}
    >
      <Icon name={icon} /> {units[0].name}
    </a>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  return {
    table: css`
      margin-top: ${theme.spacing(3)};
    `,
    filter: css`
      margin: 0 ${theme.spacing(1)};
    `,
    iconRow: css`
      svg {
        margin-left: ${theme.spacing(0.5)};
      }
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
  };
};

export default UserListAdminPage;
