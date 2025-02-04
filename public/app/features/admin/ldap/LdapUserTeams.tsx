import React from 'react';

import { Tooltip, Icon } from '@grafana/ui';
import { LdapTeam } from 'app/types';

interface Props {
  teams: LdapTeam[];
  showAttributeMapping?: boolean;
}

export const LdapUserTeams = ({ teams, showAttributeMapping }: Props) => {
  const items = showAttributeMapping ? teams : teams.filter((item) => item.teamName);

  return (
    <div className="gf-form-group">
      <div className="gf-form">
        <table className="filter-table form-inline">
          <thead>
            <tr>
              {showAttributeMapping && <th>LDAP Group</th>}
              <th>Organisation</th>
              <th>Team</th>
            </tr>
          </thead>
          <tbody>
            {items.map((team, index) => {
              return (
                <tr key={`${team.teamName}-${index}`}>
                  {showAttributeMapping && (
                    <>
                      <td>{team.groupDN}</td>
                      {!team.orgName && (
                        <>
                          <td />
                          <td>
                            <span className="text-warning">无匹配</span>
                            <Tooltip placement="top" content="未找到匹配的团队" theme={'info'}>
                              <Icon name="info-circle" />
                            </Tooltip>
                          </td>
                        </>
                      )}
                    </>
                  )}
                  {team.orgName && (
                    <>
                      <td>{team.orgName}</td>
                      <td>{team.teamName}</td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
