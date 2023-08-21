import { css } from '@emotion/css';
import React, { useState } from 'react';

import { QueryEditorProps } from '@grafana/data';
import {
  Button,
  FileDropzone,
  HorizontalGroup,
  InlineField,
  InlineFieldRow,
  Modal,
  QueryField,
  RadioButtonGroup,
  useStyles2,
  useTheme2,
} from '@grafana/ui';

import { JaegerDatasource } from '../datasource';
import { JaegerQuery, JaegerQueryType } from '../types';

import { SearchForm } from './SearchForm';

type Props = QueryEditorProps<JaegerDatasource, JaegerQuery>;

export function QueryEditor({ datasource, query, onChange, onRunQuery }: Props) {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const theme = useTheme2();
  const styles = useStyles2(getStyles);

  const onChangeQuery = (value: string) => {
    const nextQuery: JaegerQuery = { ...query, query: value };
    onChange(nextQuery);
  };

  const renderEditorBody = () => {
    switch (query.queryType) {
      case 'search':
        return <SearchForm datasource={datasource} query={query} onChange={onChange} />;
      default:
        return (
          <InlineFieldRow>
            <InlineField label="跟踪ID" labelWidth={14} grow>
              <QueryField
                query={query.query}
                onChange={onChangeQuery}
                onRunQuery={onRunQuery}
                placeholder={'输入跟踪ID (快捷键Shift+Enter)'}
                portalOrigin="jaeger"
              />
            </InlineField>
          </InlineFieldRow>
        );
    }
  };

  return (
    <>
      <Modal title={'上传跟踪'} isOpen={uploadModalOpen} onDismiss={() => setUploadModalOpen(false)}>
        <div className={css({ padding: theme.spacing(2) })}>
          <FileDropzone
            options={{ multiple: false }}
            onLoad={(result) => {
              datasource.uploadedJson = result;
              onChange({
                ...query,
                queryType: 'upload',
              });
              setUploadModalOpen(false);
              onRunQuery();
            }}
          />
        </div>
      </Modal>
      <div className={styles.container}>
        <InlineFieldRow>
          <InlineField label="查询类型" grow={true}>
            <HorizontalGroup spacing={'sm'} align={'center'} justify={'space-between'}>
              <RadioButtonGroup<JaegerQueryType>
                options={[
                  { value: 'search', label: '搜索' },
                  { value: undefined, label: '跟踪ID' },
                ]}
                value={query.queryType}
                onChange={(v) =>
                  onChange({
                    ...query,
                    queryType: v,
                  })
                }
                size="md"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setUploadModalOpen(true);
                }}
              >
                导入
              </Button>
            </HorizontalGroup>
          </InlineField>
        </InlineFieldRow>
        {renderEditorBody()}
      </div>
    </>
  );
}

const getStyles = () => ({
  container: css`
    width: 100%;
  `,
});
