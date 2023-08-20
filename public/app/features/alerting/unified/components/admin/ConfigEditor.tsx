import React from 'react';

import { Button, CodeEditor, ConfirmModal, Field, Form, HorizontalGroup } from '@grafana/ui';

import { GRAFANA_RULES_SOURCE_NAME } from '../../utils/datasource';

import { FormValues } from './AlertmanagerConfig';

interface ConfigEditorProps {
  defaultValues: { configJSON: string };
  readOnly: boolean;
  loading: boolean;
  alertManagerSourceName?: string;
  onSubmit: (values: FormValues) => void;
  showConfirmDeleteAMConfig?: boolean;
  onReset?: () => void;
  onConfirmReset?: () => void;
  onDismiss?: () => void;
}

export const ConfigEditor = ({
  defaultValues,
  readOnly,
  loading,
  alertManagerSourceName,
  showConfirmDeleteAMConfig,
  onSubmit,
  onReset,
  onConfirmReset,
  onDismiss,
}: ConfigEditorProps) => {
  return (
    <Form defaultValues={defaultValues} onSubmit={onSubmit} key={defaultValues.configJSON}>
      {({ errors, setValue, register }) => {
        register('configJSON', {
          required: { value: true, message: 'Required' },
          validate: (value: string) => {
            try {
              JSON.parse(value);
              return true;
            } catch (e) {
              return e instanceof Error ? e.message : 'JSON is invalid';
            }
          },
        });

        return (
          <>
            <Field
              disabled={loading}
              label="配置"
              invalid={!!errors.configJSON}
              error={errors.configJSON?.message}
              data-testid={readOnly ? 'readonly-config' : 'config'}
            >
              <CodeEditor
                language="json"
                width="100%"
                height={500}
                showLineNumbers={true}
                value={defaultValues.configJSON}
                showMiniMap={false}
                onSave={(value) => {
                  setValue('configJSON', value);
                }}
                onBlur={(value) => {
                  setValue('configJSON', value);
                }}
                readOnly={readOnly}
              />
            </Field>

            {!readOnly && (
              <HorizontalGroup>
                <Button type="submit" variant="primary" disabled={loading}>
                  保存配置
                </Button>
                {onReset && (
                  <Button type="button" disabled={loading} variant="destructive" onClick={onReset}>
                    重置配置
                  </Button>
                )}
              </HorizontalGroup>
            )}

            {Boolean(showConfirmDeleteAMConfig) && onConfirmReset && onDismiss && (
              <ConfirmModal
                isOpen={true}
                title="重置警报管理器配置"
                body={`是否确实要重置配置 ${
                  alertManagerSourceName === GRAFANA_RULES_SOURCE_NAME
                    ? '-警报管理器'
                    : `-"${alertManagerSourceName}"`
                }? 联系点和通知策略将重置为其默认值。`}
                confirmText="确定"
                onConfirm={onConfirmReset}
                onDismiss={onDismiss}
              />
            )}
          </>
        );
      }}
    </Form>
  );
};
