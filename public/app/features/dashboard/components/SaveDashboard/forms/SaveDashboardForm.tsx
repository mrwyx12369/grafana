import React, { useMemo, useState } from 'react';

import { selectors } from '@grafana/e2e-selectors';
import { Stack } from '@grafana/experimental';
import { Button, Checkbox, Form, TextArea } from '@grafana/ui';
import { DashboardModel } from 'app/features/dashboard/state';

import { SaveDashboardData, SaveDashboardOptions } from '../types';

interface FormDTO {
  message: string;
}

export type SaveProps = {
  dashboard: DashboardModel; // original
  isLoading: boolean;
  saveModel: SaveDashboardData; // already cloned
  onCancel: () => void;
  onSuccess: () => void;
  onSubmit?: (clone: DashboardModel, options: SaveDashboardOptions, dashboard: DashboardModel) => Promise<any>;
  options: SaveDashboardOptions;
  onOptionsChange: (opts: SaveDashboardOptions) => void;
};

export const SaveDashboardForm = ({
  dashboard,
  isLoading,
  saveModel,
  options,
  onSubmit,
  onCancel,
  onSuccess,
  onOptionsChange,
}: SaveProps) => {
  const hasTimeChanged = useMemo(() => dashboard.hasTimeChanged(), [dashboard]);
  const hasVariableChanged = useMemo(() => dashboard.hasVariableValuesChanged(), [dashboard]);

  const [saving, setSaving] = useState(false);

  return (
    <Form
      onSubmit={async (data: FormDTO) => {
        if (!onSubmit) {
          return;
        }
        setSaving(true);
        options = { ...options, message: data.message };
        const result = await onSubmit(saveModel.clone, options, dashboard);
        if (result.status === 'success') {
          if (options.saveVariables) {
            dashboard.resetOriginalVariables();
          }
          if (options.saveTimerange) {
            dashboard.resetOriginalTime();
          }
          onSuccess();
        } else {
          setSaving(false);
        }
      }}
    >
      {({ register, errors }) => {
        const messageProps = register('message');
        return (
          <Stack gap={2} direction="column" alignItems="flex-start">
            {hasTimeChanged && (
              <Checkbox
                checked={!!options.saveTimerange}
                onChange={() =>
                  onOptionsChange({
                    ...options,
                    saveTimerange: !options.saveTimerange,
                  })
                }
                label="将当前时间范围另存为仪表板默认值"
                aria-label={selectors.pages.SaveDashboardModal.saveTimerange}
              />
            )}
            {hasVariableChanged && (
              <Checkbox
                checked={!!options.saveVariables}
                onChange={() =>
                  onOptionsChange({
                    ...options,
                    saveVariables: !options.saveVariables,
                  })
                }
                label="将当前变量值另存为仪表板默认值"
                aria-label={selectors.pages.SaveDashboardModal.saveVariables}
              />
            )}
            <TextArea
              {...messageProps}
              aria-label="message"
              value={options.message}
              onChange={(e) => {
                onOptionsChange({
                  ...options,
                  message: e.currentTarget.value,
                });
                messageProps.onChange(e);
              }}
              placeholder="添加注释以描述您的更改。"
              autoFocus
              rows={5}
            />
            <Stack alignItems="center">
              <Button variant="secondary" onClick={onCancel} fill="outline">
                取消
              </Button>
              <Button
                type="submit"
                disabled={!saveModel.hasChanges || isLoading}
                icon={saving ? 'fa fa-spinner' : undefined}
                aria-label={selectors.pages.SaveDashboardModal.save}
              >
                {isLoading ? '保存...' : '保存'}
              </Button>
              {!saveModel.hasChanges && <div>无需保存任何更改</div>}
            </Stack>
          </Stack>
        );
      }}
    </Form>
  );
};
