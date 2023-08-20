import { css } from '@emotion/css';
import React, { useState } from 'react';

import { arrayUtils, AnnotationQuery } from '@grafana/data';
import { getDataSourceSrv } from '@grafana/runtime';
import { Button, DeleteButton, IconButton, useStyles2, VerticalGroup } from '@grafana/ui';
import EmptyListCTA from 'app/core/components/EmptyListCTA/EmptyListCTA';

import { DashboardModel } from '../../state/DashboardModel';
import { ListNewButton } from '../DashboardSettings/ListNewButton';

type Props = {
  dashboard: DashboardModel;
  onNew: () => void;
  onEdit: (idx: number) => void;
};

export const AnnotationSettingsList = ({ dashboard, onNew, onEdit }: Props) => {
  const styles = useStyles2(getStyles);
  const [annotations, updateAnnotations] = useState(dashboard.annotations.list);

  const onMove = (idx: number, direction: number) => {
    dashboard.annotations.list = arrayUtils.moveItemImmutably(annotations, idx, idx + direction);
    updateAnnotations(dashboard.annotations.list);
  };

  const onDelete = (idx: number) => {
    dashboard.annotations.list = [...annotations.slice(0, idx), ...annotations.slice(idx + 1)];
    updateAnnotations(dashboard.annotations.list);
  };

  const showEmptyListCTA = annotations.length === 0 || (annotations.length === 1 && annotations[0].builtIn);

  const getAnnotationName = (anno: AnnotationQuery) => {
    if (anno.enable === false) {
      return (
        <>
          <em className="muted">(Disabled) &nbsp; {anno.name}</em>
        </>
      );
    }

    if (anno.builtIn) {
      return (
        <>
          <em className="muted">{anno.name} &nbsp; (Built-in)</em>
        </>
      );
    }

    return <>{anno.name}</>;
  };

  const dataSourceSrv = getDataSourceSrv();
  return (
    <VerticalGroup>
      {annotations.length > 0 && (
        <div className={styles.table}>
          <table role="grid" className="filter-table filter-table--hover">
            <thead>
              <tr>
                <th>查询名称</th>
                <th>数据源</th>
                <th colSpan={3}></th>
              </tr>
            </thead>
            <tbody>
              {dashboard.annotations.list.map((annotation, idx) => (
                <tr key={`${annotation.name}-${idx}`}>
                  {annotation.builtIn ? (
                    <td role="gridcell" style={{ width: '90%' }} className="pointer" onClick={() => onEdit(idx)}>
                      <Button size="sm" fill="text" variant="secondary">
                        {getAnnotationName(annotation)}
                      </Button>
                    </td>
                  ) : (
                    <td role="gridcell" className="pointer" onClick={() => onEdit(idx)}>
                      <Button size="sm" fill="text" variant="secondary">
                        {getAnnotationName(annotation)}
                      </Button>
                    </td>
                  )}
                  <td role="gridcell" className="pointer" onClick={() => onEdit(idx)}>
                    {dataSourceSrv.getInstanceSettings(annotation.datasource)?.name || annotation.datasource?.uid}
                  </td>
                  <td role="gridcell" style={{ width: '1%' }}>
                    {idx !== 0 && <IconButton name="arrow-up" onClick={() => onMove(idx, -1)} tooltip="Move up" />}
                  </td>
                  <td role="gridcell" style={{ width: '1%' }}>
                    {dashboard.annotations.list.length > 1 && idx !== dashboard.annotations.list.length - 1 ? (
                      <IconButton name="arrow-down" onClick={() => onMove(idx, 1)} tooltip="Move down" />
                    ) : null}
                  </td>
                  <td role="gridcell" style={{ width: '1%' }}>
                    {!annotation.builtIn && (
                      <DeleteButton
                        size="sm"
                        onConfirm={() => onDelete(idx)}
                        aria-label={`Delete query with title "${annotation.name}"`}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showEmptyListCTA && (
        <EmptyListCTA
          onClick={onNew}
          title="没有添加自定义注释查询t"
          buttonIcon="comment-alt"
          buttonTitle="添加注释查询"
          infoBoxTitle="什么是注释查询?"
          infoBox={{
            __html: `<p>批注提供了一种将事件数据集成到图表中的方法。它们被可视化为垂直线和所有图形面板上的图标。当您将鼠标悬停在注释图标上时，您可以获得事件文本和标签
            事件。您可以通过按住 CTRL 或 CMD + 单击图形（或拖动区域）。这些将存储在格拉法纳的注释数据库中。
        </p>
        详见
        <a class='external-link' target='_blank' href='#'
          >注释文档</a
        >`,
          }}
        />
      )}
      {!showEmptyListCTA && <ListNewButton onClick={onNew}>New query</ListNewButton>}
    </VerticalGroup>
  );
};

const getStyles = () => ({
  table: css`
    width: 100%;
    overflow-x: scroll;
  `,
});
