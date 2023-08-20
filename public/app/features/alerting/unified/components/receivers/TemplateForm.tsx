import { css } from '@emotion/css';
import { subDays } from 'date-fns';
import { Location } from 'history';
import React, { useCallback, useEffect, useState } from 'react';
import { FormProvider, useForm, useFormContext, Validate } from 'react-hook-form';
import { useLocation } from 'react-router-dom';
import AutoSizer from 'react-virtualized-auto-sizer';

import { GrafanaTheme2 } from '@grafana/data';
import { Stack } from '@grafana/experimental';
import {
  Alert,
  Button,
  CollapsableSection,
  Field,
  FieldSet,
  Input,
  LinkButton,
  Spinner,
  Tab,
  TabsBar,
  useStyles2,
} from '@grafana/ui';
import { useCleanup } from 'app/core/hooks/useCleanup';
import { AlertManagerCortexConfig } from 'app/plugins/datasource/alertmanager/types';
import { useDispatch } from 'app/types';

import {
  AlertField,
  TemplatePreviewErrors,
  TemplatePreviewResponse,
  TemplatePreviewResult,
  usePreviewTemplateMutation,
} from '../../api/templateApi';
import { useUnifiedAlertingSelector } from '../../hooks/useUnifiedAlertingSelector';
import { updateAlertManagerConfigAction } from '../../state/actions';
import { GRAFANA_RULES_SOURCE_NAME } from '../../utils/datasource';
import { makeAMLink } from '../../utils/misc';
import { initialAsyncRequestState } from '../../utils/redux';
import { ensureDefine } from '../../utils/templates';
import { ProvisionedResource, ProvisioningAlert } from '../Provisioning';

import { PayloadEditor } from './PayloadEditor';
import { TemplateDataDocs } from './TemplateDataDocs';
import { TemplateEditor } from './TemplateEditor';
import { snippets } from './editor/templateDataSuggestions';

export interface TemplateFormValues {
  name: string;
  content: string;
}

export const defaults: TemplateFormValues = Object.freeze({
  name: '',
  content: '',
});

interface Props {
  existing?: TemplateFormValues;
  config: AlertManagerCortexConfig;
  alertManagerSourceName: string;
  provenance?: string;
}
export const isDuplicating = (location: Location) => location.pathname.endsWith('/duplicate');

const DEFAULT_PAYLOAD = `[
  {
    "annotations": {
      "summary": "实例实例 1 已关闭超过 5 分钟"
    },
    "labels": {
      "instance": "实例1"
    },
    "startsAt": "${subDays(new Date(), 1).toISOString()}"
  }]
`;

export const TemplateForm = ({ existing, alertManagerSourceName, config, provenance }: Props) => {
  const styles = useStyles2(getStyles);
  const dispatch = useDispatch();

  useCleanup((state) => (state.unifiedAlerting.saveAMConfig = initialAsyncRequestState));

  const { loading, error } = useUnifiedAlertingSelector((state) => state.saveAMConfig);

  const location = useLocation();
  const isduplicating = isDuplicating(location);

  const [payload, setPayload] = useState(DEFAULT_PAYLOAD);
  const [payloadFormatError, setPayloadFormatError] = useState<string | null>(null);

  const [view, setView] = useState<'content' | 'preview'>('content');

  const onPayloadError = () => setView('preview');

  const submit = (values: TemplateFormValues) => {
    // wrap content in "define" if it's not already wrapped, in case user did not do it/
    // it's not obvious that this is needed for template to work
    const content = ensureDefine(values.name, values.content);

    // add new template to template map
    const template_files = {
      ...config.template_files,
      [values.name]: content,
    };

    // delete existing one (if name changed, otherwise it was overwritten in previous step)
    if (existing && existing.name !== values.name) {
      delete template_files[existing.name];
    }

    // make sure name for the template is configured on the alertmanager config object
    const templates = [
      ...(config.alertmanager_config.templates ?? []).filter((name) => name !== existing?.name),
      values.name,
    ];

    const newConfig: AlertManagerCortexConfig = {
      template_files,
      alertmanager_config: {
        ...config.alertmanager_config,
        templates,
      },
    };
    dispatch(
      updateAlertManagerConfigAction({
        alertManagerSourceName,
        newConfig,
        oldConfig: config,
        successMessage: '模板已保存。',
        redirectPath: '/alerting/notifications',
      })
    );
  };

  const formApi = useForm<TemplateFormValues>({
    mode: 'onSubmit',
    defaultValues: existing ?? defaults,
  });
  const {
    handleSubmit,
    register,
    formState: { errors },
    getValues,
    setValue,
    watch,
  } = formApi;

  const validateNameIsUnique: Validate<string> = (name: string) => {
    return !config.template_files[name] || existing?.name === name
      ? true
      : '具有此名称的另一个模板已存在。';
  };
  const isGrafanaAlertManager = alertManagerSourceName === GRAFANA_RULES_SOURCE_NAME;

  return (
    <FormProvider {...formApi}>
      <form onSubmit={handleSubmit(submit)}>
        <h4>{existing && !isduplicating ? '编辑通知模板' : '创建通知模板'}</h4>
        {error && (
          <Alert severity="error" title="保存模板时出错">
            {error.message || (error as any)?.data?.message || String(error)}
          </Alert>
        )}
        {provenance && <ProvisioningAlert resource={ProvisionedResource.Template} />}
        <FieldSet disabled={Boolean(provenance)}>
          <Field label="模板名称" error={errors?.name?.message} invalid={!!errors.name?.message} required>
            <Input
              {...register('name', {
                required: { value: true, message: '必填项.' },
                validate: { nameIsUnique: validateNameIsUnique },
              })}
              placeholder="为模板命名"
              width={42}
              autoFocus={true}
            />
          </Field>
          <TemplatingGuideline />
          <div className={styles.editorsWrapper}>
            <div className={styles.contentContainer}>
              <TabsBar>
                <Tab label="内容" active={view === 'content'} onChangeTab={() => setView('content')} />
                {isGrafanaAlertManager && (
                  <Tab label="预览" active={view === 'preview'} onChangeTab={() => setView('preview')} />
                )}
              </TabsBar>
              <div className={styles.contentContainerEditor}>
                <AutoSizer>
                  {({ width }) => (
                    <>
                      {view === 'content' ? (
                        <div>
                          <Field error={errors?.content?.message} invalid={!!errors.content?.message} required>
                            <div className={styles.editWrapper}>
                              <TemplateEditor
                                value={getValues('content')}
                                width={width}
                                height={363}
                                onBlur={(value) => setValue('content', value)}
                              />
                            </div>
                          </Field>
                          <div className={styles.buttons}>
                            {loading && (
                              <Button disabled={true} icon="fa fa-spinner" variant="primary">
                                保存...
                              </Button>
                            )}
                            {!loading && (
                              <Button type="submit" variant="primary">
                                保存
                              </Button>
                            )}
                            <LinkButton
                              disabled={loading}
                              href={makeAMLink('alerting/notifications', alertManagerSourceName)}
                              variant="secondary"
                              type="button"
                            >
                              取消
                            </LinkButton>
                          </div>
                        </div>
                      ) : (
                        <TemplatePreview
                          width={width}
                          payload={payload}
                          templateName={watch('name')}
                          setPayloadFormatError={setPayloadFormatError}
                          payloadFormatError={payloadFormatError}
                        />
                      )}
                    </>
                  )}
                </AutoSizer>
              </div>
            </div>
            {isGrafanaAlertManager && (
              <PayloadEditor
                payload={payload}
                setPayload={setPayload}
                defaultPayload={DEFAULT_PAYLOAD}
                setPayloadFormatError={setPayloadFormatError}
                payloadFormatError={payloadFormatError}
                onPayloadError={onPayloadError}
              />
            )}
          </div>
        </FieldSet>
        <CollapsableSection label="数据备忘单" isOpen={false} className={styles.collapsableSection}>
          <TemplateDataDocs />
        </CollapsableSection>
      </form>
    </FormProvider>
  );
};

function TemplatingGuideline() {
  const styles = useStyles2(getStyles);

  return (
    <Alert title="模板指南" severity="info">
      <Stack direction="row">
        <div>
          系统使用Golang模板语言来创建通知消息。
          <br />
          要了解有关模板的更多信息，请访问我们的文档。
        </div>
        <div>
          <LinkButton
            href="https://www.smxy.com/docs/datav/latest/alerting/manage-notifications/template-notifications/"
            target="_blank"
            icon="external-link-alt"
            variant="secondary"
          >
            模板化文档
          </LinkButton>
        </div>
      </Stack>

      <div className={styles.snippets}>
        为了使模板化更容易，我们在内容编辑器中提供了一些代码段，以帮助您加快工作流程。
        <div className={styles.code}>
          {Object.values(snippets)
            .map((s) => s.label)
            .join(', ')}
        </div>
      </div>
    </Alert>
  );
}

function getResultsToRender(results: TemplatePreviewResult[]) {
  const filteredResults = results.filter((result) => result.text.trim().length > 0);

  const moreThanOne = filteredResults.length > 1;

  const preview = (result: TemplatePreviewResult) => {
    const previewForLabel = `预览: ${result.name}:`;
    const separatorStart = '='.repeat(previewForLabel.length).concat('>');
    const separatorEnd = '<'.concat('='.repeat(previewForLabel.length));
    if (moreThanOne) {
      return `${previewForLabel}\n${separatorStart}${result.text}${separatorEnd}\n`;
    } else {
      return `${separatorStart}${result.text}${separatorEnd}\n`;
    }
  };

  return filteredResults
    .map((result: TemplatePreviewResult) => {
      return preview(result);
    })
    .join(`\n`);
}

function getErrorsToRender(results: TemplatePreviewErrors[]) {
  return results
    .map((result: TemplatePreviewErrors) => {
      if (result.name) {
        return `错误: ${result.name}:\n`.concat(`${result.kind}\n${result.message}\n`);
      } else {
        return `错误:\n${result.kind}\n${result.message}\n`;
      }
    })
    .join(`\n`);
}

export const PREVIEW_NOT_AVAILABLE = '预览请求失败。检查有效负载数据是否具有正确的结构。';

function getPreviewTorender(
  isPreviewError: boolean,
  payloadFormatError: string | null,
  data: TemplatePreviewResponse | undefined
) {
  // ERRORS IN JSON OR IN REQUEST (endpoint not available, for example)
  const previewErrorRequest = isPreviewError ? PREVIEW_NOT_AVAILABLE : undefined;
  const somethingWasWrong: boolean = isPreviewError || Boolean(payloadFormatError);
  const errorToRender = payloadFormatError || previewErrorRequest;

  //PREVIEW : RESULTS AND ERRORS
  const previewResponseResults = data?.results;
  const previewResponseErrors = data?.errors;

  const previewResultsToRender = previewResponseResults ? getResultsToRender(previewResponseResults) : '';
  const previewErrorsToRender = previewResponseErrors ? getErrorsToRender(previewResponseErrors) : '';

  if (somethingWasWrong) {
    return errorToRender;
  } else {
    return `${previewResultsToRender}\n${previewErrorsToRender}`;
  }
}

export function TemplatePreview({
  payload,
  templateName,
  payloadFormatError,
  setPayloadFormatError,
  width,
}: {
  payload: string;
  templateName: string;
  payloadFormatError: string | null;
  setPayloadFormatError: (value: React.SetStateAction<string | null>) => void;
  width: number;
}) {
  const styles = useStyles2(getStyles);

  const { watch } = useFormContext<TemplateFormValues>();

  const templateContent = watch('content');

  const [trigger, { data, isError: isPreviewError, isLoading }] = usePreviewTemplateMutation();

  const previewToRender = getPreviewTorender(isPreviewError, payloadFormatError, data);

  const onPreview = useCallback(() => {
    try {
      const alertList: AlertField[] = JSON.parse(payload);
      JSON.stringify([...alertList]); // check if it's iterable, in order to be able to add more data
      trigger({ template: templateContent, alerts: alertList, name: templateName });
      setPayloadFormatError(null);
    } catch (e) {
      setPayloadFormatError(e instanceof Error ? e.message : 'Invalid JSON.');
    }
  }, [templateContent, templateName, payload, setPayloadFormatError, trigger]);

  useEffect(() => onPreview(), [onPreview]);

  return (
    <div style={{ width: `${width}px` }} className={styles.preview.wrapper}>
      {isLoading && (
        <>
          <Spinner inline={true} /> Loading preview...
        </>
      )}
      <pre className={styles.preview.result} data-testid="payloadJSON">
        {previewToRender}
      </pre>
      <Button onClick={onPreview} className={styles.preview.button} icon="arrow-up" type="button" variant="secondary">
        Refresh preview
      </Button>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  contentContainer: css`
    flex: 1;
    margin-bottom: ${theme.spacing(6)};
  `,
  contentContainerEditor: css`
      flex:1;
      display: flex;
      padding-top: 10px;
      gap: ${theme.spacing(2)};
      flex-direction: row;
      align-items: flex-start;
      flex-wrap: wrap;
      ${theme.breakpoints.up('xxl')} {
        flex - wrap: nowrap;
    }
      min-width: 450px;
      height: 363px;
      `,
  snippets: css`
    margin-top: ${theme.spacing(2)};
    font-size: ${theme.typography.bodySmall.fontSize};
  `,
  code: css`
    color: ${theme.colors.text.secondary};
    font-weight: ${theme.typography.fontWeightBold};
  `,
  buttons: css`
    display: flex;
    & > * + * {
      margin-left: ${theme.spacing(1)};
    }
    margin-top: -7px;
  `,
  textarea: css`
    max-width: 758px;
  `,
  editWrapper: css`
      display: flex;
      width: 100%
      heigth:100%;
      position: relative;
      `,
  toggle: css`
      color: theme.colors.text.secondary,
      marginRight: ${theme.spacing(1)}`,
  preview: {
    wrapper: css`
      display: flex;
      width: 100%
      heigth:100%;
      position: relative;
      flex-direction: column;
      `,
    result: css`
      width: 100%;
      height: 363px;
    `,
    button: css`
      flex: none;
      width: fit-content;
      margin-top: -6px;
    `,
  },
  collapsableSection: css`
    width: fit-content;
  `,
  editorsWrapper: css`
    display: flex;
    flex: 1;
    flex-wrap: wrap;
    gap: ${theme.spacing(1)};
  `,
});
