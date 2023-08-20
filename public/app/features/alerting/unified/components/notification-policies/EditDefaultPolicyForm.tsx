import React, { ReactNode, useState } from 'react';

import { Collapse, Field, Form, InputControl, Link, MultiSelect, Select, useStyles2 } from '@grafana/ui';
import { RouteWithID } from 'app/plugins/datasource/alertmanager/types';

import { FormAmRoute } from '../../types/amroutes';
import {
  amRouteToFormAmRoute,
  commonGroupByOptions,
  mapMultiSelectValueToStrings,
  mapSelectValueToString,
  promDurationValidator,
  repeatIntervalValidator,
  stringsToSelectableValues,
  stringToSelectableValue,
} from '../../utils/amroutes';
import { makeAMLink } from '../../utils/misc';
import { AmRouteReceiver } from '../receivers/grafanaAppReceivers/types';

import { PromDurationInput } from './PromDurationInput';
import { getFormStyles } from './formStyles';
import { TIMING_OPTIONS_DEFAULTS } from './timingOptions';

export interface AmRootRouteFormProps {
  alertManagerSourceName: string;
  actionButtons: ReactNode;
  onSubmit: (route: Partial<FormAmRoute>) => void;
  receivers: AmRouteReceiver[];
  route: RouteWithID;
}

export const AmRootRouteForm = ({
  actionButtons,
  alertManagerSourceName,
  onSubmit,
  receivers,
  route,
}: AmRootRouteFormProps) => {
  const styles = useStyles2(getFormStyles);
  const [isTimingOptionsExpanded, setIsTimingOptionsExpanded] = useState(false);
  const [groupByOptions, setGroupByOptions] = useState(stringsToSelectableValues(route.group_by));

  const defaultValues = amRouteToFormAmRoute(route);

  return (
    <Form defaultValues={{ ...defaultValues, overrideTimings: true, overrideGrouping: true }} onSubmit={onSubmit}>
      {({ register, control, errors, setValue, getValues }) => (
        <>
          <Field label="默认联系点" invalid={!!errors.receiver} error={errors.receiver?.message}>
            <>
              <div className={styles.container} data-testid="am-receiver-select">
                <InputControl
                  render={({ field: { onChange, ref, ...field } }) => (
                    <Select
                      aria-label="Default contact point"
                      {...field}
                      className={styles.input}
                      onChange={(value) => onChange(mapSelectValueToString(value))}
                      options={receivers}
                    />
                  )}
                  control={control}
                  name="receiver"
                  rules={{ required: { value: true, message: '必填项.' } }}
                />
                <span>或</span>
                <Link
                  className={styles.linkText}
                  href={makeAMLink('/alerting/notifications/receivers/new', alertManagerSourceName)}
                >
                  创建联系点
                </Link>
              </div>
            </>
          </Field>
          <Field
            label="分组依据"
            description="收到基于标签的通知时对警报进行分组。"
            data-testid="am-group-select"
          >
            {/* @ts-ignore-check: react-hook-form made me do this */}
            <InputControl
              render={({ field: { onChange, ref, ...field } }) => (
                <MultiSelect
                  aria-label="Group by"
                  {...field}
                  allowCustomValue
                  className={styles.input}
                  onCreateOption={(opt: string) => {
                    setGroupByOptions((opts) => [...opts, stringToSelectableValue(opt)]);

                    // @ts-ignore-check: react-hook-form made me do this
                    setValue('groupBy', [...field.value, opt]);
                  }}
                  onChange={(value) => onChange(mapMultiSelectValueToStrings(value))}
                  options={[...commonGroupByOptions, ...groupByOptions]}
                />
              )}
              control={control}
              name="groupBy"
            />
          </Field>
          <Collapse
            collapsible
            className={styles.collapse}
            isOpen={isTimingOptionsExpanded}
            label="定时选项"
            onToggle={setIsTimingOptionsExpanded}
          >
            <div className={styles.timingFormContainer}>
              <Field
                label="分组等待"
                description="为传入警报创建的新组发送初始通知之前的等待时间。默认为 30 秒。"
                invalid={!!errors.groupWaitValue}
                error={errors.groupWaitValue?.message}
                data-testid="am-group-wait"
              >
                <PromDurationInput
                  {...register('groupWaitValue', { validate: promDurationValidator })}
                  placeholder={TIMING_OPTIONS_DEFAULTS.group_wait}
                  className={styles.promDurationInput}
                  aria-label="Group wait"
                />
              </Field>
              <Field
                label="分组间隔"
                description="发送第一个通知后为该组发送一批新警报的等待时间。默认为 5 分钟。"
                invalid={!!errors.groupIntervalValue}
                error={errors.groupIntervalValue?.message}
                data-testid="am-group-interval"
              >
                <PromDurationInput
                  {...register('groupIntervalValue', { validate: promDurationValidator })}
                  placeholder={TIMING_OPTIONS_DEFAULTS.group_interval}
                  className={styles.promDurationInput}
                  aria-label="Group interval"
                />
              </Field>
              <Field
                label="重复间隔"
                description="成功发送警报后重新发送警报的等待时间。默认为 4 小时。"
                invalid={!!errors.repeatIntervalValue}
                error={errors.repeatIntervalValue?.message}
                data-testid="am-repeat-interval"
              >
                <PromDurationInput
                  {...register('repeatIntervalValue', {
                    validate: (value: string) => {
                      const groupInterval = getValues('groupIntervalValue');
                      return repeatIntervalValidator(value, groupInterval);
                    },
                  })}
                  placeholder={TIMING_OPTIONS_DEFAULTS.repeat_interval}
                  className={styles.promDurationInput}
                  aria-label="Repeat interval"
                />
              </Field>
            </div>
          </Collapse>
          <div className={styles.container}>{actionButtons}</div>
        </>
      )}
    </Form>
  );
};
