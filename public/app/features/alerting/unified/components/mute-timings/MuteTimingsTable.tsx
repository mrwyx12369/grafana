import { css } from '@emotion/css';
import React, { useMemo, useState } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { Stack } from '@grafana/experimental';
import { IconButton, LinkButton, Link, useStyles2, ConfirmModal } from '@grafana/ui';
import { contextSrv } from 'app/core/services/context_srv';
import { MuteTimeInterval } from 'app/plugins/datasource/alertmanager/types';
import { useDispatch } from 'app/types/store';

import { Authorize } from '../../components/Authorize';
import { useAlertmanagerConfig } from '../../hooks/useAlertmanagerConfig';
import { deleteMuteTimingAction } from '../../state/actions';
import { getNotificationsPermissions } from '../../utils/access-control';
import { makeAMLink } from '../../utils/misc';
import { DynamicTable, DynamicTableItemProps, DynamicTableColumnProps } from '../DynamicTable';
import { EmptyAreaWithCTA } from '../EmptyAreaWithCTA';
import { ProvisioningBadge } from '../Provisioning';
import { Spacer } from '../Spacer';

import { renderTimeIntervals } from './util';

interface Props {
  alertManagerSourceName: string;
  muteTimingNames?: string[];
  hideActions?: boolean;
}

export const MuteTimingsTable = ({ alertManagerSourceName, muteTimingNames, hideActions }: Props) => {
  const styles = useStyles2(getStyles);
  const dispatch = useDispatch();
  const permissions = getNotificationsPermissions(alertManagerSourceName);

  const { currentData } = useAlertmanagerConfig(alertManagerSourceName, {
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  const config = currentData?.alertmanager_config;

  const [muteTimingName, setMuteTimingName] = useState<string>('');

  const items = useMemo((): Array<DynamicTableItemProps<MuteTimeInterval>> => {
    const muteTimings = config?.mute_time_intervals ?? [];
    const muteTimingsProvenances = config?.muteTimeProvenances ?? {};

    return muteTimings
      .filter(({ name }) => (muteTimingNames ? muteTimingNames.includes(name) : true))
      .map((mute) => {
        return {
          id: mute.name,
          data: {
            ...mute,
            provenance: muteTimingsProvenances[mute.name],
          },
        };
      });
  }, [config?.mute_time_intervals, config?.muteTimeProvenances, muteTimingNames]);

  const columns = useColumns(alertManagerSourceName, hideActions, setMuteTimingName);

  return (
    <div className={styles.container}>
      <Stack direction="row" alignItems="center">
        <span>
          Enter specific time intervals when not to send notifications or freeze notifications for recurring periods of
          time.
        </span>
        <Spacer />
        {!hideActions && items.length > 0 && (
          <Authorize actions={[permissions.create]}>
            <LinkButton
              className={styles.addMuteButton}
              icon="plus"
              variant="primary"
              href={makeAMLink('alerting/routes/mute-timing/new', alertManagerSourceName)}
            >
              Add mute timing
            </LinkButton>
          </Authorize>
        )}
      </Stack>
      {items.length > 0 ? (
        <DynamicTable items={items} cols={columns} />
      ) : !hideActions ? (
        <EmptyAreaWithCTA
          text="您尚未创建任何静音计时"
          buttonLabel="添加静音计时"
          buttonIcon="plus"
          buttonSize="lg"
          href={makeAMLink('alerting/routes/mute-timing/new', alertManagerSourceName)}
          showButton={contextSrv.hasPermission(permissions.create)}
        />
      ) : (
        <EmptyAreaWithCTA text="No mute timings configured" buttonLabel={''} showButton={false} />
      )}
      {!hideActions && (
        <ConfirmModal
          isOpen={!!muteTimingName}
          title="删除静音计时"
          body={`您确定要删除"${muteTimingName}"吗？ `}
          confirmText="Delete"
          onConfirm={() => {
            dispatch(deleteMuteTimingAction(alertManagerSourceName, muteTimingName));
            setMuteTimingName('');
          }}
          onDismiss={() => setMuteTimingName('')}
        />
      )}
    </div>
  );
};

function useColumns(alertManagerSourceName: string, hideActions = false, setMuteTimingName: (name: string) => void) {
  const permissions = getNotificationsPermissions(alertManagerSourceName);

  const userHasEditPermissions = contextSrv.hasPermission(permissions.update);
  const userHasDeletePermissions = contextSrv.hasPermission(permissions.delete);
  const showActions = !hideActions && (userHasEditPermissions || userHasDeletePermissions);

  return useMemo((): Array<DynamicTableColumnProps<MuteTimeInterval>> => {
    const columns: Array<DynamicTableColumnProps<MuteTimeInterval>> = [
      {
        id: 'name',
        label: '名称',
        renderCell: function renderName({ data }) {
          return (
            <>
              {data.name} {data.provenance && <ProvisioningBadge />}
            </>
          );
        },
        size: '250px',
      },
      {
        id: 'timeRange',
        label: '时间范围',
        renderCell: ({ data }) => {
          return renderTimeIntervals(data);
        },
      },
    ];
    if (showActions) {
      columns.push({
        id: 'actions',
        label: '操作',
        renderCell: function renderActions({ data }) {
          if (data.provenance) {
            return (
              <div>
                <Link
                  href={makeAMLink(`/alerting/routes/mute-timing/edit`, alertManagerSourceName, {
                    muteName: data.name,
                  })}
                >
                  <IconButton name="file-alt" tooltip="查看静音计时" />
                </Link>
              </div>
            );
          }
          return (
            <div>
              <Authorize actions={[permissions.update]}>
                <Link
                  href={makeAMLink(`/alerting/routes/mute-timing/edit`, alertManagerSourceName, {
                    muteName: data.name,
                  })}
                >
                  <IconButton name="edit" tooltip="编辑静音计时" />
                </Link>
              </Authorize>
              <Authorize actions={[permissions.delete]}>
                <IconButton
                  name="trash-alt"
                  tooltip="Delete mute timing"
                  onClick={() => setMuteTimingName(data.name)}
                />
              </Authorize>
            </div>
          );
        },
        size: '100px',
      });
    }
    return columns;
  }, [alertManagerSourceName, setMuteTimingName, showActions, permissions]);
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    display: flex;
    flex-flow: column nowrap;
  `,
  addMuteButton: css`
    margin-bottom: ${theme.spacing(2)};
    align-self: flex-end;
  `,
});
