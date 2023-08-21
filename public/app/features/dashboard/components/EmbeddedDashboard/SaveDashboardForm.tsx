import React, { useMemo, useState } from 'react';

import { Stack } from '@grafana/experimental';
import { Button, Form } from '@grafana/ui';
import { useAppNotification } from 'app/core/copy/appNotification';

import { DashboardModel } from '../../state';
import { SaveDashboardData } from '../SaveDashboard/types';

interface SaveDashboardProps {
  dashboard: DashboardModel;
  onCancel: () => void;
  onSubmit?: (clone: DashboardModel) => Promise<unknown>;
  onSuccess: () => void;
  saveModel: SaveDashboardData;
}
export const SaveDashboardForm = ({ dashboard, onCancel, onSubmit, onSuccess, saveModel }: SaveDashboardProps) => {
  const [saving, setSaving] = useState(false);
  const notifyApp = useAppNotification();
  const hasChanges = useMemo(() => dashboard.hasTimeChanged() || saveModel.hasChanges, [dashboard, saveModel]);

  const onFormSubmit = async () => {
    if (!onSubmit) {
      return;
    }
    setSaving(true);
    onSubmit(saveModel.clone)
      .then(() => {
        notifyApp.success('仪表板已保存！');
        onSuccess();
      })
      .catch((error) => {
        notifyApp.error(error.message || '保存仪表板时出错');
      })
      .finally(() => setSaving(false));
  };

  return (
    <Form onSubmit={onFormSubmit}>
      {() => {
        return (
          <Stack gap={2}>
            <Stack alignItems="center">
              <Button variant="secondary" onClick={onCancel} fill="outline">
                取消
              </Button>
              <Button type="submit" disabled={!hasChanges} icon={saving ? 'fa fa-spinner' : undefined}>
                保存
              </Button>
              {!hasChanges && <div>无需保存任何更改</div>}
            </Stack>
          </Stack>
        );
      }}
    </Form>
  );
};
