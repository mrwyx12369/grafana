import React, { useCallback, useState } from 'react';
import { useCopyToClipboard } from 'react-use';

import { SelectableValue } from '@grafana/data';
import { EditorField, EditorHeader, EditorMode, EditorRow, FlexItem, InlineSelect, Space } from '@grafana/experimental';
import { Button, InlineSwitch, RadioButtonGroup, Tooltip } from '@grafana/ui';

import { QueryWithDefaults } from '../defaults';
import { SQLQuery, QueryFormat, QueryRowFilter, QUERY_FORMAT_OPTIONS, DB } from '../types';

import { ConfirmModal } from './ConfirmModal';
import { DatasetSelector } from './DatasetSelector';
import { isSqlDatasourceDatabaseSelectionFeatureFlagEnabled } from './QueryEditorFeatureFlag.utils';
import { TableSelector } from './TableSelector';

export interface QueryHeaderProps {
  db: DB;
  isPostgresInstance?: boolean;
  isQueryRunnable: boolean;
  onChange: (query: SQLQuery) => void;
  onQueryRowChange: (queryRowFilter: QueryRowFilter) => void;
  onRunQuery: () => void;
  preconfiguredDataset: string;
  query: QueryWithDefaults;
  queryRowFilter: QueryRowFilter;
}

const editorModes = [
  { label: '构建器', value: EditorMode.Builder },
  { label: '代码', value: EditorMode.Code },
];

export function QueryHeader({
  db,
  isPostgresInstance,
  isQueryRunnable,
  onChange,
  onQueryRowChange,
  onRunQuery,
  preconfiguredDataset,
  query,
  queryRowFilter,
}: QueryHeaderProps) {
  const { editorMode } = query;
  const [_, copyToClipboard] = useCopyToClipboard();
  const [showConfirm, setShowConfirm] = useState(false);
  const toRawSql = db.toRawSql;

  const onEditorModeChange = useCallback(
    (newEditorMode: EditorMode) => {
      if (editorMode === EditorMode.Code) {
        setShowConfirm(true);
        return;
      }
      onChange({ ...query, editorMode: newEditorMode });
    },
    [editorMode, onChange, query]
  );

  const onFormatChange = (e: SelectableValue) => {
    const next = { ...query, format: e.value !== undefined ? e.value : QueryFormat.Table };
    onChange(next);
  };

  const onDatasetChange = (e: SelectableValue) => {
    if (e.value === query.dataset) {
      return;
    }

    const next = {
      ...query,
      dataset: e.value,
      table: undefined,
      sql: undefined,
      rawSql: '',
    };

    onChange(next);
  };

  const onTableChange = (e: SelectableValue) => {
    if (e.value === query.table) {
      return;
    }

    const next: SQLQuery = {
      ...query,
      table: e.value,
      sql: undefined,
      rawSql: '',
    };

    onChange(next);
  };

  const datasetDropdownIsAvailable = () => {
    // If the feature flag is DISABLED, && the datasource is Postgres (`isPostgresInstance`),
    // we want to hide the dropdown - as per previous behavior.
    if (!isSqlDatasourceDatabaseSelectionFeatureFlagEnabled() && isPostgresInstance) {
      return false;
    }

    return true;
  };

  return (
    <>
      <EditorHeader>
        <InlineSelect
          label="格式"
          value={query.format}
          placeholder="选择格式"
          menuShouldPortal
          onChange={onFormatChange}
          options={QUERY_FORMAT_OPTIONS}
        />

        {editorMode === EditorMode.Builder && (
          <>
            <InlineSwitch
              id="sql-filter"
              label="筛选"
              transparent={true}
              showLabel={true}
              value={queryRowFilter.filter}
              onChange={(ev) =>
                ev.target instanceof HTMLInputElement &&
                onQueryRowChange({ ...queryRowFilter, filter: ev.target.checked })
              }
            />

            <InlineSwitch
              id="sql-group"
              label="分组"
              transparent={true}
              showLabel={true}
              value={queryRowFilter.group}
              onChange={(ev) =>
                ev.target instanceof HTMLInputElement &&
                onQueryRowChange({ ...queryRowFilter, group: ev.target.checked })
              }
            />

            <InlineSwitch
              id="sql-order"
              label="排序顺序"
              transparent={true}
              showLabel={true}
              value={queryRowFilter.order}
              onChange={(ev) =>
                ev.target instanceof HTMLInputElement &&
                onQueryRowChange({ ...queryRowFilter, order: ev.target.checked })
              }
            />

            <InlineSwitch
              id="sql-preview"
              label="预览"
              transparent={true}
              showLabel={true}
              value={queryRowFilter.preview}
              onChange={(ev) =>
                ev.target instanceof HTMLInputElement &&
                onQueryRowChange({ ...queryRowFilter, preview: ev.target.checked })
              }
            />
          </>
        )}

        <FlexItem grow={1} />

        {isQueryRunnable ? (
          <Button icon="play" variant="primary" size="sm" onClick={() => onRunQuery()}>
            运行查询
          </Button>
        ) : (
          <Tooltip
            theme="error"
            content={
              <>
              您的查询无效。详情请看下文。但是，您仍然可以运行此查询。
              </>
            }
            placement="top"
          >
            <Button icon="exclamation-triangle" variant="secondary" size="sm" onClick={() => onRunQuery()}>
              运行查
            </Button>
          </Tooltip>
        )}

        <RadioButtonGroup options={editorModes} size="sm" value={editorMode} onChange={onEditorModeChange} />

        <ConfirmModal
          isOpen={showConfirm}
          onCopy={() => {
            setShowConfirm(false);
            copyToClipboard(query.rawSql!);
            onChange({
              ...query,
              rawSql: toRawSql(query),
              editorMode: EditorMode.Builder,
            });
          }}
          onDiscard={() => {
            setShowConfirm(false);
            onChange({
              ...query,
              rawSql: toRawSql(query),
              editorMode: EditorMode.Builder,
            });
          }}
          onCancel={() => setShowConfirm(false)}
        />
      </EditorHeader>

      {editorMode === EditorMode.Builder && (
        <>
          <Space v={0.5} />
          <EditorRow>
            {datasetDropdownIsAvailable() && (
              <EditorField label="数据集" width={25}>
                <DatasetSelector
                  db={db}
                  dataset={query.dataset}
                  isPostgresInstance={isPostgresInstance}
                  preconfiguredDataset={preconfiguredDataset}
                  onChange={onDatasetChange}
                />
              </EditorField>
            )}
            <EditorField label="数据表" width={25}>
              <TableSelector
                db={db}
                dataset={query.dataset || preconfiguredDataset}
                table={query.table}
                onChange={onTableChange}
              />
            </EditorField>
          </EditorRow>
        </>
      )}
    </>
  );
}
