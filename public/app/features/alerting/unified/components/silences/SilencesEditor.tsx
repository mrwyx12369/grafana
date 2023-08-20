import { css, cx } from '@emotion/css';
import { isEqual, pickBy } from 'lodash';
import React, { useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useDebounce } from 'react-use';

import {
  addDurationToDate,
  dateTime,
  DefaultTimeZone,
  GrafanaTheme2,
  intervalToAbbreviatedDurationString,
  isValidDate,
  parseDuration,
} from '@grafana/data';
import { config } from '@grafana/runtime';
import { Button, Field, FieldSet, Input, LinkButton, TextArea, useStyles2 } from '@grafana/ui';
import { useCleanup } from 'app/core/hooks/useCleanup';
import { Matcher, MatcherOperator, Silence, SilenceCreatePayload } from 'app/plugins/datasource/alertmanager/types';
import { useDispatch } from 'app/types';

import { useURLSearchParams } from '../../hooks/useURLSearchParams';
import { useUnifiedAlertingSelector } from '../../hooks/useUnifiedAlertingSelector';
import { createOrUpdateSilenceAction } from '../../state/actions';
import { SilenceFormFields } from '../../types/silence-form';
import { matcherFieldToMatcher, matcherToMatcherField } from '../../utils/alertmanager';
import { parseQueryParamMatchers } from '../../utils/matchers';
import { makeAMLink } from '../../utils/misc';
import { initialAsyncRequestState } from '../../utils/redux';

import MatchersField from './MatchersField';
import { SilencePeriod } from './SilencePeriod';
import { SilencedInstancesPreview } from './SilencedInstancesPreview';

interface Props {
  silence?: Silence;
  alertManagerSourceName: string;
}

const defaultsFromQuery = (searchParams: URLSearchParams): Partial<SilenceFormFields> => {
  const defaults: Partial<SilenceFormFields> = {};

  const comment = searchParams.get('comment');
  const matchers = searchParams.getAll('matcher');

  const formMatchers = parseQueryParamMatchers(matchers);
  if (formMatchers.length) {
    defaults.matchers = formMatchers.map(matcherToMatcherField);
  }

  if (comment) {
    defaults.comment = comment;
  }

  return defaults;
};

const getDefaultFormValues = (searchParams: URLSearchParams, silence?: Silence): SilenceFormFields => {
  const now = new Date();
  if (silence) {
    const isExpired = Date.parse(silence.endsAt) < Date.now();
    const interval = isExpired
      ? {
          start: now,
          end: addDurationToDate(now, { hours: 2 }),
        }
      : { start: new Date(silence.startsAt), end: new Date(silence.endsAt) };
    return {
      id: silence.id,
      startsAt: interval.start.toISOString(),
      endsAt: interval.end.toISOString(),
      comment: silence.comment,
      createdBy: silence.createdBy,
      duration: intervalToAbbreviatedDurationString(interval),
      isRegex: false,
      matchers: silence.matchers?.map(matcherToMatcherField) || [],
      matcherName: '',
      matcherValue: '',
      timeZone: DefaultTimeZone,
    };
  } else {
    const endsAt = addDurationToDate(now, { hours: 2 }); // Default time period is now + 2h
    return {
      id: '',
      startsAt: now.toISOString(),
      endsAt: endsAt.toISOString(),
      comment: `created ${dateTime().format('YYYY-MM-DD HH:mm')}`,
      createdBy: config.bootData.user.name,
      duration: '2h',
      isRegex: false,
      matchers: [{ name: '', value: '', operator: MatcherOperator.equal }],
      matcherName: '',
      matcherValue: '',
      timeZone: DefaultTimeZone,
      ...defaultsFromQuery(searchParams),
    };
  }
};

export const SilencesEditor = ({ silence, alertManagerSourceName }: Props) => {
  const [urlSearchParams] = useURLSearchParams();

  const defaultValues = useMemo(() => getDefaultFormValues(urlSearchParams, silence), [silence, urlSearchParams]);
  const formAPI = useForm({ defaultValues });
  const dispatch = useDispatch();
  const styles = useStyles2(getStyles);
  const [matchersForPreview, setMatchersForPreview] = useState<Matcher[]>(
    defaultValues.matchers.map(matcherFieldToMatcher)
  );

  const { loading } = useUnifiedAlertingSelector((state) => state.updateSilence);

  useCleanup((state) => (state.unifiedAlerting.updateSilence = initialAsyncRequestState));

  const { register, handleSubmit, formState, watch, setValue, clearErrors } = formAPI;

  const onSubmit = (data: SilenceFormFields) => {
    const { id, startsAt, endsAt, comment, createdBy, matchers: matchersFields } = data;
    const matchers = matchersFields.map(matcherFieldToMatcher);
    const payload = pickBy(
      {
        id,
        startsAt,
        endsAt,
        comment,
        createdBy,
        matchers,
      },
      (value) => !!value
    ) as SilenceCreatePayload;
    dispatch(
      createOrUpdateSilenceAction({
        alertManagerSourceName,
        payload,
        exitOnSave: true,
        successMessage: `静默 ${payload.id ? '已更新' : '创建'}`,
      })
    );
  };

  const duration = watch('duration');
  const startsAt = watch('startsAt');
  const endsAt = watch('endsAt');
  const matcherFields = watch('matchers');

  // Keep duration and endsAt in sync
  const [prevDuration, setPrevDuration] = useState(duration);
  useDebounce(
    () => {
      if (isValidDate(startsAt) && isValidDate(endsAt)) {
        if (duration !== prevDuration) {
          setValue('endsAt', dateTime(addDurationToDate(new Date(startsAt), parseDuration(duration))).toISOString());
          setPrevDuration(duration);
        } else {
          const startValue = new Date(startsAt).valueOf();
          const endValue = new Date(endsAt).valueOf();
          if (endValue > startValue) {
            const nextDuration = intervalToAbbreviatedDurationString({
              start: new Date(startsAt),
              end: new Date(endsAt),
            });
            setValue('duration', nextDuration);
            setPrevDuration(nextDuration);
          }
        }
      }
    },
    700,
    [clearErrors, duration, endsAt, prevDuration, setValue, startsAt]
  );

  useDebounce(
    () => {
      // React-hook-form watch does not return referentialy equal values so this trick is needed
      const newMatchers = matcherFields.filter((m) => m.name && m.value).map(matcherFieldToMatcher);
      if (!isEqual(matchersForPreview, newMatchers)) {
        setMatchersForPreview(newMatchers);
      }
    },
    700,
    [matcherFields]
  );

  const userLogged = Boolean(config.bootData.user.isSignedIn && config.bootData.user.name);

  return (
    <FormProvider {...formAPI}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <FieldSet label={`${silence ? '重建静默' : '新建静默'}`}>
          <div className={cx(styles.flexRow, styles.silencePeriod)}>
            <SilencePeriod />
            <Field
              label="持续时间"
              invalid={!!formState.errors.duration}
              error={
                formState.errors.duration &&
                (formState.errors.duration.type === 'required' ? '必填项.' : formState.errors.duration.message)
              }
            >
              <Input
                className={styles.createdBy}
                {...register('duration', {
                  validate: (value) =>
                    Object.keys(parseDuration(value)).length === 0
                      ? '持续时间无效。有效示例：1d 4h（可用单 y, M, w, d, h, m, s)'
                      : undefined,
                })}
                id="duration"
              />
            </Field>
          </div>

          <MatchersField />
          <Field
            className={cx(styles.field, styles.textArea)}
            label="评论"
            required
            error={formState.errors.comment?.message}
            invalid={!!formState.errors.comment}
          >
            <TextArea
              {...register('comment', { required: { value: true, message: '必填项.' } })}
              rows={5}
              placeholder="有关静默的详细信息"
            />
          </Field>
          {!userLogged && (
            <Field
              className={cx(styles.field, styles.createdBy)}
              label="创建人"
              required
              error={formState.errors.createdBy?.message}
              invalid={!!formState.errors.createdBy}
            >
              <Input
                {...register('createdBy', { required: { value: true, message: '必填项.' } })}
                placeholder="创建静默的用户"
              />
            </Field>
          )}
          <SilencedInstancesPreview amSourceName={alertManagerSourceName} matchers={matchersForPreview} />
        </FieldSet>
        <div className={styles.flexRow}>
          {loading && (
            <Button disabled={true} icon="fa fa-spinner" variant="primary">
              保存...
            </Button>
          )}
          {!loading && <Button type="submit">保存静默</Button>}
          <LinkButton href={makeAMLink('alerting/silences', alertManagerSourceName)} variant={'secondary'}>
              取消
          </LinkButton>
        </div>
      </form>
    </FormProvider>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  field: css`
    margin: ${theme.spacing(1, 0)};
  `,
  textArea: css`
    max-width: ${theme.breakpoints.values.sm}px;
  `,
  createdBy: css`
    width: 200px;
  `,
  flexRow: css`
    display: flex;
    flex-direction: row;
    justify-content: flex-start;

    & > * {
      margin-right: ${theme.spacing(1)};
    }
  `,
  silencePeriod: css`
    max-width: ${theme.breakpoints.values.sm}px;
  `,
});

export default SilencesEditor;
