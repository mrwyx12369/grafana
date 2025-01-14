import React, { useState } from 'react';
import { connect, ConnectedProps } from 'react-redux';

import { TimeZone } from '@grafana/data';
import { CollapsableSection, Field, Input, RadioButtonGroup, TagsInput } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';
import { FolderPicker } from 'app/core/components/Select/FolderPicker';
import { updateTimeZoneDashboard, updateWeekStartDashboard } from 'app/features/dashboard/state/actions';

import { DeleteDashboardButton } from '../DeleteDashboard/DeleteDashboardButton';

import { TimePickerSettings } from './TimePickerSettings';
import { SettingsPageProps } from './types';

export type Props = SettingsPageProps & ConnectedProps<typeof connector>;

const GRAPH_TOOLTIP_OPTIONS = [
  { value: 0, label: '默认' },
  { value: 1, label: '共享十字准线' },
  { value: 2, label: '共享工具提示' },
];

export function GeneralSettingsUnconnected({
  dashboard,
  updateTimeZone,
  updateWeekStart,
  sectionNav,
}: Props): JSX.Element {
  const [renderCounter, setRenderCounter] = useState(0);

  const onFolderChange = (newUID: string, newTitle: string) => {
    dashboard.meta.folderUid = newUID;
    dashboard.meta.folderTitle = newTitle;
    dashboard.meta.hasUnsavedFolderChange = true;
    setRenderCounter(renderCounter + 1);
  };

  const onBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    if (event.currentTarget.name === 'title' || event.currentTarget.name === 'description') {
      dashboard[event.currentTarget.name] = event.currentTarget.value;
    }
  };

  const onTooltipChange = (graphTooltip: number) => {
    dashboard.graphTooltip = graphTooltip;
    setRenderCounter(renderCounter + 1);
  };

  const onRefreshIntervalChange = (intervals: string[]) => {
    dashboard.timepicker.refresh_intervals = intervals.filter((i) => i.trim() !== '');
  };

  const onNowDelayChange = (nowDelay: string) => {
    dashboard.timepicker.nowDelay = nowDelay;
  };

  const onHideTimePickerChange = (hide: boolean) => {
    dashboard.timepicker.hidden = hide;
    setRenderCounter(renderCounter + 1);
  };

  const onLiveNowChange = (v: boolean) => {
    dashboard.liveNow = v;
    setRenderCounter(renderCounter + 1);
  };

  const onTimeZoneChange = (timeZone: TimeZone) => {
    dashboard.timezone = timeZone;
    setRenderCounter(renderCounter + 1);
    updateTimeZone(timeZone);
  };

  const onWeekStartChange = (weekStart: string) => {
    dashboard.weekStart = weekStart;
    setRenderCounter(renderCounter + 1);
    updateWeekStart(weekStart);
  };

  const onTagsChange = (tags: string[]) => {
    dashboard.tags = tags;
    setRenderCounter(renderCounter + 1);
  };

  const onEditableChange = (value: boolean) => {
    dashboard.editable = value;
    setRenderCounter(renderCounter + 1);
  };

  const editableOptions = [
    { label: '可编辑', value: true },
    { label: '只读', value: false },
  ];

  return (
    <Page navModel={sectionNav}>
      <div style={{ maxWidth: '600px' }}>
        <div className="gf-form-group">
          <Field label="名称">
            <Input id="title-input" name="title" onBlur={onBlur} defaultValue={dashboard.title} />
          </Field>
          <Field label="描述">
            <Input id="description-input" name="description" onBlur={onBlur} defaultValue={dashboard.description} />
          </Field>
          <Field label="标签">
            <TagsInput id="tags-input" tags={dashboard.tags} onChange={onTagsChange} width={40} />
          </Field>

          <Field label="文件夹">
            <FolderPicker
              value={dashboard.meta.folderUid}
              onChange={onFolderChange}
              // TODO deprecated props that can be removed once NestedFolderPicker is enabled by default
              initialTitle={dashboard.meta.folderTitle}
              inputId="dashboard-folder-input"
              enableCreateNew
              dashboardId={dashboard.id}
              skipInitialLoad
            />
          </Field>

          <Field
            label="编辑"
            description="设置为只读以禁用所有编辑。重新加载仪表板以使更改生效"
          >
            <RadioButtonGroup value={dashboard.editable} options={editableOptions} onChange={onEditableChange} />
          </Field>
        </div>

        <TimePickerSettings
          onTimeZoneChange={onTimeZoneChange}
          onWeekStartChange={onWeekStartChange}
          onRefreshIntervalChange={onRefreshIntervalChange}
          onNowDelayChange={onNowDelayChange}
          onHideTimePickerChange={onHideTimePickerChange}
          onLiveNowChange={onLiveNowChange}
          refreshIntervals={dashboard.timepicker.refresh_intervals}
          timePickerHidden={dashboard.timepicker.hidden}
          nowDelay={dashboard.timepicker.nowDelay}
          timezone={dashboard.timezone}
          weekStart={dashboard.weekStart}
          liveNow={dashboard.liveNow}
        />

        {/* @todo: Update "Graph tooltip" description to remove prompt about reloading when resolving #46581 */}
        <CollapsableSection label="面板选项" isOpen={true}>
          <Field
            label="图形工具"
            description="控制工具提示和悬停在不同面板上的突出显示行为。重新加载仪表板以使更改生效"
          >
            <RadioButtonGroup
              onChange={onTooltipChange}
              options={GRAPH_TOOLTIP_OPTIONS}
              value={dashboard.graphTooltip}
            />
          </Field>
        </CollapsableSection>

        <div className="gf-form-button-row">
          {dashboard.meta.canDelete && <DeleteDashboardButton dashboard={dashboard} />}
        </div>
      </div>
    </Page>
  );
}

const mapDispatchToProps = {
  updateTimeZone: updateTimeZoneDashboard,
  updateWeekStart: updateWeekStartDashboard,
};

const connector = connect(null, mapDispatchToProps);

export const GeneralSettings = connector(GeneralSettingsUnconnected);
