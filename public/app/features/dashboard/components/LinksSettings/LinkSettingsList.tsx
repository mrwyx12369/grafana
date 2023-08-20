import { css } from '@emotion/css';
import React, { useState } from 'react';

import { arrayUtils } from '@grafana/data';
import { DeleteButton, HorizontalGroup, Icon, IconButton, TagList, useStyles2 } from '@grafana/ui';
import EmptyListCTA from 'app/core/components/EmptyListCTA/EmptyListCTA';

import { DashboardModel, DashboardLink } from '../../state/DashboardModel';
import { ListNewButton } from '../DashboardSettings/ListNewButton';

type LinkSettingsListProps = {
  dashboard: DashboardModel;
  onNew: () => void;
  onEdit: (idx: number) => void;
};

export const LinkSettingsList = ({ dashboard, onNew, onEdit }: LinkSettingsListProps) => {
  const styles = useStyles2(getStyles);

  const [links, setLinks] = useState(dashboard.links);

  const moveLink = (idx: number, direction: number) => {
    dashboard.links = arrayUtils.moveItemImmutably(links, idx, idx + direction);
    setLinks(dashboard.links);
  };

  const duplicateLink = (link: DashboardLink, idx: number) => {
    dashboard.links = [...links, { ...link }];
    setLinks(dashboard.links);
  };

  const deleteLink = (idx: number) => {
    dashboard.links = [...links.slice(0, idx), ...links.slice(idx + 1)];
    setLinks(dashboard.links);
  };

  const isEmptyList = dashboard.links.length === 0;

  if (isEmptyList) {
    return (
      <div>
        <EmptyListCTA
          onClick={onNew}
          title="尚未添加仪表板链接"
          buttonIcon="link"
          buttonTitle="添加仪表板链接"
          infoBoxTitle="什么是仪表板链接？"
          infoBox={{
            __html:
              '<p>仪表板链接允许您将指向其他仪表板和网站的链接直接放在仪表板标题下方。</p>',
          }}
        />
      </div>
    );
  }

  return (
    <>
      <table role="grid" className="filter-table filter-table--hover">
        <thead>
          <tr>
            <th>类型</th>
            <th>信息</th>
            <th colSpan={3} />
          </tr>
        </thead>
        <tbody>
          {links.map((link, idx) => (
            <tr key={`${link.title}-${idx}`}>
              <td role="gridcell" className="pointer" onClick={() => onEdit(idx)}>
                <Icon name="external-link-alt" /> &nbsp; {link.type}
              </td>
              <td role="gridcell">
                <HorizontalGroup>
                  {link.title && <span className={styles.titleWrapper}>{link.title}</span>}
                  {link.type === 'link' && <span className={styles.urlWrapper}>{link.url}</span>}
                  {link.type === 'dashboards' && <TagList tags={link.tags ?? []} />}
                </HorizontalGroup>
              </td>
              <td style={{ width: '1%' }} role="gridcell">
                {idx !== 0 && <IconButton name="arrow-up" onClick={() => moveLink(idx, -1)} tooltip="上移链接" />}
              </td>
              <td style={{ width: '1%' }} role="gridcell">
                {links.length > 1 && idx !== links.length - 1 ? (
                  <IconButton name="arrow-down" onClick={() => moveLink(idx, 1)} tooltip="下移链接" />
                ) : null}
              </td>
              <td style={{ width: '1%' }} role="gridcell">
                <IconButton name="copy" onClick={() => duplicateLink(link, idx)} tooltip="复制链接" />
              </td>
              <td style={{ width: '1%' }} role="gridcell">
                <DeleteButton
                  aria-label={`Delete link with title "${link.title}"`}
                  size="sm"
                  onConfirm={() => deleteLink(idx)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ListNewButton onClick={onNew}>新连接</ListNewButton>
    </>
  );
};

const getStyles = () => ({
  titleWrapper: css`
    width: 20vw;
    text-overflow: ellipsis;
    overflow: hidden;
  `,
  urlWrapper: css`
    width: 40vw;
    text-overflow: ellipsis;
    overflow: hidden;
  `,
});
