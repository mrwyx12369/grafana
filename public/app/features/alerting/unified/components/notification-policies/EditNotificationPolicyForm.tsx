import { css } from '@emotion/css';
import React, { ReactNode, useState } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { Stack } from '@grafana/experimental';
import {
  Button,
  Field,
  FieldArray,
  Form,
  IconButton,
  Input,
  InputControl,
  MultiSelect,
  Select,
  Switch,
  useStyles2,
  Badge,
  FieldValidationMessage,
} from '@grafana/ui';
import { MatcherOperator, RouteWithID } from 'app/plugins/datasource/alertmanager/types';

import { useMuteTimingOptions } from '../../hooks/useMuteTimingOptions';
import { FormAmRoute } from '../../types/amroutes';
import { SupportedPlugin } from '../../types/pluginBridges';
import { matcherFieldOptions } from '../../utils/alertmanager';
import {
  emptyArrayFieldMatcher,
  mapMultiSelectValueToStrings,
  mapSelectValueToString,
  stringToSelectableValue,
  stringsToSelectableValues,
  commonGroupByOptions,
  amRouteToFormAmRoute,
  promDurationValidator,
  repeatIntervalValidator,
} from '../../utils/amroutes';
import { AmRouteReceiver } from '../receivers/grafanaAppReceivers/types';

import { PromDurationInput } from './PromDurationInput';
import { getFormStyles } from './formStyles';

export interface AmRoutesExpandedFormProps {
  receivers: AmRouteReceiver[];
  route?: RouteWithID;
  onSubmit: (route: Partial<FormAmRoute>) => void;
  actionButtons: ReactNode;
  defaults?: Partial<FormAmRoute>;
}

export const AmRoutesExpandedForm = ({
  actionButtons,
  receivers,
  route,
  onSubmit,
  defaults,
}: AmRoutesExpandedFormProps) => {
  const styles = useStyles2(getStyles);
  const formStyles = useStyles2(getFormStyles);
  const [groupByOptions, setGroupByOptions] = useState(stringsToSelectableValues(route?.group_by));
  const muteTimingOptions = useMuteTimingOptions();
  const emptyMatcher = [{ name: '', operator: MatcherOperator.equal, value: '' }];

  const receiversWithOnCallOnTop = receivers.sort(onCallFirst);

  const formAmRoute = {
    ...amRouteToFormAmRoute(route),
    ...defaults,
  };

  const defaultValues: Omit<FormAmRoute, 'routes'> = {
    ...formAmRoute,
    // if we're adding a new route, show at least one empty matcher
    object_matchers: route ? formAmRoute.object_matchers : emptyMatcher,
  };

  return (
    <Form defaultValues={defaultValues} onSubmit={onSubmit} maxWidth="none">
      {({ control, register, errors, setValue, watch, getValues }) => (
        <>
          <input type="hidden" {...register('id')} />
          {/* @ts-ignore-check: react-hook-form made me do this */}
          <FieldArray name="object_matchers" control={control}>
            {({ fields, append, remove }) => (
              <>
                <Stack direction="column" alignItems="flex-start">
                  <div>匹配标签</div>
                  {fields.length === 0 && (
                    <Badge
                      color="orange"
                      className={styles.noMatchersWarning}
                      icon="exclamation-triangle"
                      text="如果未指定匹配器，则此通知策略将处理所有警报实例。"
                    />
                  )}
                  {fields.length > 0 && (
                    <div className={styles.matchersContainer}>
                      {fields.map((field, index) => {
                        return (
                          <Stack direction="row" key={field.id} alignItems="center">
                            <Field
                              label="标签"
                              invalid={!!errors.object_matchers?.[index]?.name}
                              error={errors.object_matchers?.[index]?.name?.message}
                            >
                              <Input
                                {...register(`object_matchers.${index}.name`, { required: '字段为必填项' })}
                                defaultValue={field.name}
                                placeholder="标签"
                                autoFocus
                              />
                            </Field>
                            <Field label={'操作'}>
                              <InputControl
                                render={({ field: { onChange, ref, ...field } }) => (
                                  <Select
                                    {...field}
                                    className={styles.matchersOperator}
                                    onChange={(value) => onChange(value?.value)}
                                    options={matcherFieldOptions}
                                    aria-label="Operator"
                                  />
                                )}
                                defaultValue={field.operator}
                                control={control}
                                name={`object_matchers.${index}.operator`}
                                rules={{ required: { value: true, message: '必填项.' } }}
                              />
                            </Field>
                            <Field
                              label="值"
                              invalid={!!errors.object_matchers?.[index]?.value}
                              error={errors.object_matchers?.[index]?.value?.message}
                            >
                              <Input
                                {...register(`object_matchers.${index}.value`, { required: '必填项' })}
                                defaultValue={field.value}
                                placeholder="值"
                              />
                            </Field>
                            <IconButton tooltip="删除匹配器" name={'trash-alt'} onClick={() => remove(index)}>
                              删除
                            </IconButton>
                          </Stack>
                        );
                      })}
                    </div>
                  )}
                  <Button
                    className={styles.addMatcherBtn}
                    icon="plus"
                    onClick={() => append(emptyArrayFieldMatcher)}
                    variant="secondary"
                    type="button"
                  >
                    添加匹配器
                  </Button>
                </Stack>
              </>
            )}
          </FieldArray>
          <Field label="联系点">
            <InputControl
              render={({ field: { onChange, ref, ...field } }) => (
                <Select
                  aria-label="联系点"
                  {...field}
                  className={formStyles.input}
                  onChange={(value) => onChange(mapSelectValueToString(value))}
                  options={receiversWithOnCallOnTop}
                  isClearable
                />
              )}
              control={control}
              name="receiver"
            />
          </Field>
          <Field label="继续匹配后续同级节点">
            <Switch id="continue-toggle" {...register('continue')} />
          </Field>
          <Field label="覆盖分组">
            <Switch id="override-grouping-toggle" {...register('overrideGrouping')} />
          </Field>
          {watch().overrideGrouping && (
            <Field
              label="分组依据"
              description="收到基于标签的通知时对警报进行分组。如果为空，它将从父策略继承。"
            >
              <InputControl
                rules={{
                  validate: (value) => {
                    if (!value || value.length === 0) {
                      return '至少需要一个分组依据选项。';
                    }
                    return true;
                  },
                }}
                render={({ field: { onChange, ref, ...field }, fieldState: { error } }) => (
                  <>
                    <MultiSelect
                      aria-label="Group by"
                      {...field}
                      invalid={Boolean(error)}
                      allowCustomValue
                      className={formStyles.input}
                      onCreateOption={(opt: string) => {
                        setGroupByOptions((opts) => [...opts, stringToSelectableValue(opt)]);

                        // @ts-ignore-check: react-hook-form made me do this
                        setValue('groupBy', [...field.value, opt]);
                      }}
                      onChange={(value) => onChange(mapMultiSelectValueToStrings(value))}
                      options={[...commonGroupByOptions, ...groupByOptions]}
                    />
                    {error && <FieldValidationMessage>{error.message}</FieldValidationMessage>}
                  </>
                )}
                control={control}
                name="groupBy"
              />
            </Field>
          )}
          <Field label="覆盖常规计时">
            <Switch id="override-timings-toggle" {...register('overrideTimings')} />
          </Field>
          {watch().overrideTimings && (
            <>
              <Field
                label="分组等待"
                description="为传入警报创建的新组发送初始通知之前的等待时间。如果为空，它将从父策略继承。"
                invalid={!!errors.groupWaitValue}
                error={errors.groupWaitValue?.message}
              >
                <PromDurationInput
                  {...register('groupWaitValue', { validate: promDurationValidator })}
                  aria-label="Group wait value"
                  className={formStyles.promDurationInput}
                />
              </Field>
              <Field
                label="分组间隔"
                description="发送第一个通知后为该组发送一批新警报的等待时间。如果为空，它将从父策略继承。"
                invalid={!!errors.groupIntervalValue}
                error={errors.groupIntervalValue?.message}
              >
                <PromDurationInput
                  {...register('groupIntervalValue', { validate: promDurationValidator })}
                  aria-label="Group interval value"
                  className={formStyles.promDurationInput}
                />
              </Field>
              <Field
                label="重复间隔"
                description="成功发送警报后重新发送警报的等待时间。"
                invalid={!!errors.repeatIntervalValue}
                error={errors.repeatIntervalValue?.message}
              >
                <PromDurationInput
                  {...register('repeatIntervalValue', {
                    validate: (value: string) => {
                      const groupInterval = getValues('groupIntervalValue');
                      return repeatIntervalValidator(value, groupInterval);
                    },
                  })}
                  aria-label="Repeat interval value"
                  className={formStyles.promDurationInput}
                />
              </Field>
            </>
          )}
          <Field
            label="静音计时"
            data-testid="am-mute-timing-select"
            description="将静音计时添加到策略"
            invalid={!!errors.muteTimeIntervals}
          >
            <InputControl
              render={({ field: { onChange, ref, ...field } }) => (
                <MultiSelect
                  aria-label="Mute timings"
                  {...field}
                  className={formStyles.input}
                  onChange={(value) => onChange(mapMultiSelectValueToStrings(value))}
                  options={muteTimingOptions}
                />
              )}
              control={control}
              name="muteTimeIntervals"
            />
          </Field>
          {actionButtons}
        </>
      )}
    </Form>
  );
};

function onCallFirst(receiver: AmRouteReceiver) {
  if (receiver.grafanaAppReceiverType === SupportedPlugin.OnCall) {
    return -1;
  } else {
    return 0;
  }
}

const getStyles = (theme: GrafanaTheme2) => {
  const commonSpacing = theme.spacing(3.5);

  return {
    addMatcherBtn: css`
      margin-bottom: ${commonSpacing};
    `,
    matchersContainer: css`
      background-color: ${theme.colors.background.secondary};
      padding: ${theme.spacing(1.5)} ${theme.spacing(2)};
      padding-bottom: 0;
      width: fit-content;
    `,
    matchersOperator: css`
      min-width: 120px;
    `,
    noMatchersWarning: css`
      padding: ${theme.spacing(1)} ${theme.spacing(2)};
    `,
  };
};
