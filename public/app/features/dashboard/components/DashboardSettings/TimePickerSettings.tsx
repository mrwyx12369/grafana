import { isEmpty } from 'lodash';
import React, { PureComponent } from 'react';

import { rangeUtil, TimeZone } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { CollapsableSection, Field, Input, Switch, TimeZonePicker, WeekStartPicker } from '@grafana/ui';

import { AutoRefreshIntervals } from './AutoRefreshIntervals';

interface Props {
  onWeekStartChange: (weekStart: string) => void;
  onTimeZoneChange: (timeZone: TimeZone) => void;
  onRefreshIntervalChange: (interval: string[]) => void;
  onNowDelayChange: (nowDelay: string) => void;
  onHideTimePickerChange: (hide: boolean) => void;
  onLiveNowChange: (liveNow: boolean) => void;
  refreshIntervals: string[];
  timePickerHidden: boolean;
  nowDelay: string;
  timezone: TimeZone;
  weekStart: string;
  liveNow: boolean;
}

interface State {
  isNowDelayValid: boolean;
}

export class TimePickerSettings extends PureComponent<Props, State> {
  state: State = { isNowDelayValid: true };

  onNowDelayChange = (event: React.FormEvent<HTMLInputElement>) => {
    const value = event.currentTarget.value;

    if (isEmpty(value)) {
      this.setState({ isNowDelayValid: true });
      return this.props.onNowDelayChange(value);
    }

    if (rangeUtil.isValidTimeSpan(value)) {
      this.setState({ isNowDelayValid: true });
      return this.props.onNowDelayChange(value);
    }

    this.setState({ isNowDelayValid: false });
  };

  onHideTimePickerChange = () => {
    this.props.onHideTimePickerChange(!this.props.timePickerHidden);
  };

  onLiveNowChange = () => {
    this.props.onLiveNowChange(!this.props.liveNow);
  };

  onTimeZoneChange = (timeZone?: string) => {
    if (typeof timeZone !== 'string') {
      return;
    }
    this.props.onTimeZoneChange(timeZone);
  };

  onWeekStartChange = (weekStart: string) => {
    this.props.onWeekStartChange(weekStart);
  };

  render() {
    return (
      <CollapsableSection label="时间选项" isOpen={true}>
        <Field label="时区" data-testid={selectors.components.TimeZonePicker.containerV2}>
          <TimeZonePicker
            inputId="time-options-input"
            includeInternal={true}
            value={this.props.timezone}
            onChange={this.onTimeZoneChange}
            width={40}
          />
        </Field>
        <Field label="周开始" data-testid={selectors.components.WeekStartPicker.containerV2}>
          <WeekStartPicker
            inputId="week-start-input"
            width={40}
            value={this.props.weekStart}
            onChange={this.onWeekStartChange}
          />
        </Field>
        <AutoRefreshIntervals
          refreshIntervals={this.props.refreshIntervals}
          onRefreshIntervalChange={this.props.onRefreshIntervalChange}
        />
        <Field label="现在延迟" description="排除可能不完整的最新数据。">
          <Input
            id="now-delay-input"
            invalid={!this.state.isNowDelayValid}
            placeholder="0m"
            onChange={this.onNowDelayChange}
            defaultValue={this.props.nowDelay}
          />
        </Field>
        <Field label="隐藏时间选取器">
          <Switch
            id="hide-time-picker-toggle"
            value={!!this.props.timePickerHidden}
            onChange={this.onHideTimePickerChange}
          />
        </Field>
        <Field
          label="刷新实时仪表板"
          description="连续重绘时间范围引用“现在”的面板"
        >
          <Switch id="refresh-live-dashboards-toggle" value={!!this.props.liveNow} onChange={this.onLiveNowChange} />
        </Field>
      </CollapsableSection>
    );
  }
}
