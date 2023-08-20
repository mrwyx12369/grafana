import React, { useEffect, useState } from 'react';

import { LinkButton, FilterInput, VerticalGroup, HorizontalGroup, Pagination, InlineField } from '@grafana/ui';
import EmptyListCTA from 'app/core/components/EmptyListCTA/EmptyListCTA';
import { Page } from 'app/core/components/Page/Page';
import { fetchRoleOptions } from 'app/core/components/RolePicker/api';
import { config } from 'app/core/config';
import { contextSrv, User } from 'app/core/services/context_srv';
import { AccessControlAction, Role, StoreState, Team } from 'app/types';

import { connectWithCleanUp } from '../../core/components/connectWithCleanUp';

import { TeamListRow } from './TeamListRow';
import { deleteTeam, loadTeams, changePage, changeQuery } from './state/actions';
import { initialTeamsState } from './state/reducers';
import { isPermissionTeamAdmin } from './state/selectors';

export interface Props {
  teams: Team[];
  page: number;
  query: string;
  noTeams: boolean;
  totalPages: number;
  hasFetched: boolean;
  loadTeams: typeof loadTeams;
  deleteTeam: typeof deleteTeam;
  changePage: typeof changePage;
  changeQuery: typeof changeQuery;
  editorsCanAdmin: boolean;
  signedInUser: User;
}

export interface State {
  roleOptions: Role[];
}

export const TeamList = ({
  teams,
  page,
  query,
  noTeams,
  totalPages,
  hasFetched,
  loadTeams,
  deleteTeam,
  changeQuery,
  changePage,
  signedInUser,
  editorsCanAdmin,
}: Props) => {
  const [roleOptions, setRoleOptions] = useState<Role[]>([]);

  useEffect(() => {
    loadTeams(true);
  }, [loadTeams]);

  useEffect(() => {
    if (contextSrv.licensedAccessControlEnabled() && contextSrv.hasPermission(AccessControlAction.ActionRolesList)) {
      fetchRoleOptions().then((roles) => setRoleOptions(roles));
    }
  }, []);

  const canCreate = canCreateTeam(editorsCanAdmin);
  const displayRolePicker = shouldDisplayRolePicker();

  return (
    <Page navId="teams">
      <Page.Contents isLoading={!hasFetched}>
        {noTeams ? (
          <EmptyListCTA
            title="您尚未创建任何团队。"
            buttonIcon="users-alt"
            buttonLink="org/teams/new"
            buttonTitle=" 新建团队"
            buttonDisabled={!contextSrv.hasPermission(AccessControlAction.ActionTeamsCreate)}
            proTip="将文件夹和仪表板权限分配给团队而不是用户，以简化管理。"
            proTipLink=""
            proTipLinkTitle=""
            proTipTarget="_blank"
          />
        ) : (
          <>
            <div className="page-action-bar">
              <InlineField grow>
                <FilterInput placeholder="搜索团队" value={query} onChange={changeQuery} />
              </InlineField>

              <LinkButton href={canCreate ? 'org/teams/new' : '#'} disabled={!canCreate}>
                New Team
              </LinkButton>
            </div>

            <div className="admin-list-table">
              <VerticalGroup spacing="md">
                <table className="filter-table filter-table--hover form-inline">
                  <thead>
                    <tr>
                      <th />
                      <th>名称</th>
                      <th>邮件</th>
                      <th>成员</th>
                      {displayRolePicker && <th>角色</th>}
                      <th style={{ width: '1%' }} />
                    </tr>
                  </thead>
                  <tbody>
                    {teams.map((team) => (
                      <TeamListRow
                        key={team.id}
                        team={team}
                        roleOptions={roleOptions}
                        displayRolePicker={displayRolePicker}
                        isTeamAdmin={isPermissionTeamAdmin({
                          permission: team.permission,
                          editorsCanAdmin,
                          signedInUser,
                        })}
                        onDelete={deleteTeam}
                      />
                    ))}
                  </tbody>
                </table>
                <HorizontalGroup justify="flex-end">
                  <Pagination
                    hideWhenSinglePage
                    currentPage={page}
                    numberOfPages={totalPages}
                    onNavigate={changePage}
                  />
                </HorizontalGroup>
              </VerticalGroup>
            </div>
          </>
        )}
      </Page.Contents>
    </Page>
  );
};

function canCreateTeam(editorsCanAdmin: boolean): boolean {
  const teamAdmin = contextSrv.hasRole('Admin') || (editorsCanAdmin && contextSrv.hasRole('Editor'));
  return contextSrv.hasAccess(AccessControlAction.ActionTeamsCreate, teamAdmin);
}

function shouldDisplayRolePicker(): boolean {
  return (
    contextSrv.licensedAccessControlEnabled() &&
    contextSrv.hasPermission(AccessControlAction.ActionTeamsRolesList) &&
    contextSrv.hasPermission(AccessControlAction.ActionRolesList)
  );
}

function mapStateToProps(state: StoreState) {
  return {
    teams: state.teams.teams,
    page: state.teams.page,
    query: state.teams.query,
    perPage: state.teams.perPage,
    noTeams: state.teams.noTeams,
    totalPages: state.teams.totalPages,
    hasFetched: state.teams.hasFetched,
    editorsCanAdmin: config.editorsCanAdmin, // this makes the feature toggle mockable/controllable from tests,
    signedInUser: contextSrv.user, // this makes the feature toggle mockable/controllable from tests,
  };
}

const mapDispatchToProps = {
  loadTeams,
  deleteTeam,
  changePage,
  changeQuery,
};

export default connectWithCleanUp(
  mapStateToProps,
  mapDispatchToProps,
  (state) => (state.teams = initialTeamsState)
)(TeamList);
