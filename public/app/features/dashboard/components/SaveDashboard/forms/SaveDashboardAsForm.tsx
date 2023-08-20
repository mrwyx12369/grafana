import React from 'react';

import { Button, Input, Switch, Form, Field, InputControl, HorizontalGroup } from '@grafana/ui';
import { FolderPicker } from 'app/core/components/Select/FolderPicker';
import { DashboardModel, PanelModel } from 'app/features/dashboard/state';
import { validationSrv } from 'app/features/manage-dashboards/services/ValidationSrv';

import { SaveDashboardFormProps } from '../types';

interface SaveDashboardAsFormDTO {
  title: string;
  $folder: { uid?: string; title?: string };
  copyTags: boolean;
}

const getSaveAsDashboardClone = (dashboard: DashboardModel) => {
  const clone = dashboard.getSaveModelClone();
  clone.id = null;
  clone.uid = '';
  clone.title += ' Copy';
  clone.editable = true;

  // remove alerts if source dashboard is already persisted
  // do not want to create alert dupes
  if (dashboard.id > 0) {
    clone.panels.forEach((panel: PanelModel) => {
      if (panel.type === 'graph' && panel.alert) {
        delete panel.thresholds;
      }
      delete panel.alert;
    });
  }

  return clone;
};

export interface SaveDashboardAsFormProps extends SaveDashboardFormProps {
  isNew?: boolean;
}

export const SaveDashboardAsForm = ({
  dashboard,
  isLoading,
  isNew,
  onSubmit,
  onCancel,
  onSuccess,
}: SaveDashboardAsFormProps) => {
  const defaultValues: SaveDashboardAsFormDTO = {
    title: isNew ? dashboard.title : `${dashboard.title}拷贝`,
    $folder: {
      uid: dashboard.meta.folderUid,
      title: dashboard.meta.folderTitle,
    },
    copyTags: false,
  };

  const validateDashboardName = (getFormValues: () => SaveDashboardAsFormDTO) => async (dashboardName: string) => {
    if (dashboardName && dashboardName === getFormValues().$folder.title?.trim()) {
      return '仪表板名称不能与文件夹名称相同';
    }

    try {
      await validationSrv.validateNewDashboardName(getFormValues().$folder.uid ?? 'general', dashboardName);
      return true;
    } catch (e) {
      return e instanceof Error ? e.message : '仪表板名称无效';
    }
  };

  return (
    <Form
      defaultValues={defaultValues}
      onSubmit={async (data: SaveDashboardAsFormDTO) => {
        if (!onSubmit) {
          return;
        }

        const clone = getSaveAsDashboardClone(dashboard);
        clone.title = data.title;
        if (!isNew && !data.copyTags) {
          clone.tags = [];
        }

        const result = await onSubmit(
          clone,
          {
            folderUid: data.$folder.uid,
          },
          dashboard
        );

        if (result.status === 'success') {
          onSuccess();
        }
      }}
    >
      {({ register, control, errors, getValues }) => (
        <>
          <Field label="仪表板名称" invalid={!!errors.title} error={errors.title?.message}>
            <Input
              {...register('title', {
                validate: validateDashboardName(getValues),
              })}
              aria-label="Save dashboard title field"
              autoFocus
            />
          </Field>
          <Field label="文件夹">
            <InputControl
              render={({ field: { ref, ...field } }) => (
                <FolderPicker
                  {...field}
                  onChange={(uid: string, title: string) => field.onChange({ uid, title })}
                  value={field.value?.uid}
                  // Old folder picker fields
                  initialTitle={dashboard.meta.folderTitle}
                  dashboardId={dashboard.id}
                  enableCreateNew
                />
              )}
              control={control}
              name="$folder"
            />
          </Field>
          {!isNew && (
            <Field label="Copy tags">
              <Switch {...register('copyTags')} />
            </Field>
          )}
          <HorizontalGroup>
            <Button type="button" variant="secondary" onClick={onCancel} fill="outline">
              取消
            </Button>
            <Button disabled={isLoading} type="submit" aria-label="Save dashboard button">
              {isLoading ? '保存...' : '保存'}
            </Button>
          </HorizontalGroup>
        </>
      )}
    </Form>
  );
};
