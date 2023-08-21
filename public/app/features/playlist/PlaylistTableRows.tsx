import { css } from '@emotion/css';
import pluralize from 'pluralize';
import React, { ReactNode } from 'react';
import { Draggable } from 'react-beautiful-dnd';

import { GrafanaTheme2 } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { Icon, IconButton, useStyles2, Spinner, IconName } from '@grafana/ui';
import { TagBadge } from 'app/core/components/TagFilter/TagBadge';

import { PlaylistItem } from './types';

interface Props {
  items: PlaylistItem[];
  onDelete: (idx: number) => void;
}

export const PlaylistTableRows = ({ items, onDelete }: Props) => {
  const styles = useStyles2(getStyles);
  if (!items?.length) {
    return (
      <div>
        <em>播放列表为空。在下面添加仪表板。</em>
      </div>
    );
  }

  const renderItem = (item: PlaylistItem) => {
    let icon: IconName = item.type === 'dashboard_by_tag' ? 'apps' : 'tag-alt';
    const info: ReactNode[] = [];

    const first = item.dashboards?.[0];
    if (!item.dashboards) {
      info.push(<Spinner key="spinner" />);
    } else if (item.type === 'dashboard_by_tag') {
      info.push(<TagBadge key={item.value} label={item.value} removeIcon={false} count={0} />);
      if (!first) {
        icon = 'exclamation-triangle';
        info.push(<span key="info">&nbsp; 未找到仪表板</span>);
      } else {
        info.push(<span key="info">&nbsp; {pluralize('个仪表板', item.dashboards.length, true)}</span>);
      }
    } else if (first) {
      info.push(
        item.dashboards.length > 1 ? (
          <span key="info">找到多个项目： ${item.value}</span>
        ) : (
          <span key="info">{first.name ?? item.value}</span>
        )
      );
    } else {
      icon = 'exclamation-triangle';
      info.push(<span key="info">&nbsp; 未找到： {item.value}</span>);
    }
    return (
      <>
        <Icon name={icon} className={styles.rightMargin} key="icon" />
        {info}
      </>
    );
  };

  return (
    <>
      {items.map((item, index) => (
        <Draggable key={`${index}/${item.value}`} draggableId={`${index}`} index={index}>
          {(provided) => (
            <div
              className={styles.row}
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              role="row"
            >
              <div className={styles.actions} role="cell" aria-label={`Playlist item, ${item.type}, ${item.value}`}>
                {renderItem(item)}
              </div>
              <div className={styles.actions}>
                <IconButton
                  name="times"
                  size="md"
                  onClick={() => onDelete(index)}
                  tooltip={selectors.pages.PlaylistForm.itemDelete}
                />
                <Icon title="拖放以重新排序" name="draggabledots" size="md" />
              </div>
            </div>
          )}
        </Draggable>
      ))}
    </>
  );
};

function getStyles(theme: GrafanaTheme2) {
  return {
    row: css`
      padding: 6px;
      background: ${theme.colors.background.secondary};
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 3px;

      border: 1px solid ${theme.colors.border.medium};
      &:hover {
        border: 1px solid ${theme.colors.border.strong};
      }
    `,
    rightMargin: css`
      margin-right: 5px;
    `,
    actions: css`
      align-items: center;
      justify-content: center;
      display: flex;
    `,
    settings: css`
      label: settings;
      text-align: right;
    `,
  };
}
