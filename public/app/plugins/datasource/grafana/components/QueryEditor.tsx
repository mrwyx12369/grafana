import { css } from '@emotion/css';
import pluralize from 'pluralize';
import React, { PureComponent } from 'react';
import { DropEvent, FileRejection } from 'react-dropzone';

import {
  QueryEditorProps,
  SelectableValue,
  dataFrameFromJSON,
  rangeUtil,
  DataQueryRequest,
  DataFrame,
  DataFrameJSON,
  dataFrameToJSON,
  GrafanaTheme2,
  getValueFormat,
  formattedValueToString,
} from '@grafana/data';
import { config, getBackendSrv, getDataSourceSrv, reportInteraction } from '@grafana/runtime';
import {
  InlineField,
  Select,
  Alert,
  Input,
  InlineFieldRow,
  InlineLabel,
  FileDropzone,
  FileDropzoneDefaultChildren,
  DropzoneFile,
  Themeable2,
  withTheme2,
} from '@grafana/ui';
import { hasAlphaPanels } from 'app/core/config';
import * as DFImport from 'app/features/dataframe-import';
import { SearchQuery } from 'app/features/search/service';

import { GrafanaDatasource } from '../datasource';
import { defaultQuery, GrafanaQuery, GrafanaQueryType } from '../types';

import SearchEditor from './SearchEditor';

interface Props extends QueryEditorProps<GrafanaDatasource, GrafanaQuery>, Themeable2 {}

const labelWidth = 12;

interface State {
  channels: Array<SelectableValue<string>>;
  channelFields: Record<string, Array<SelectableValue<string>>>;
  folders?: Array<SelectableValue<string>>;
}

export class UnthemedQueryEditor extends PureComponent<Props, State> {
  state: State = { channels: [], channelFields: {} };

  queryTypes: Array<SelectableValue<GrafanaQueryType>> = [
    {
      label: '随机游走',
      value: GrafanaQueryType.RandomWalk,
      description: '所选时间范围内的随机信号',
    },
    {
      label: '实时指标',
      value: GrafanaQueryType.LiveMeasurements,
      description: '从Grafana流式传输实时测量结果',
    },
    {
      label: '列出公共文件',
      value: GrafanaQueryType.List,
      description: '显示公共资源的目录列表',
    },
  ];

  constructor(props: Props) {
    super(props);

    if (config.featureToggles.panelTitleSearch && hasAlphaPanels) {
      this.queryTypes.push({
        label: '搜索',
        value: GrafanaQueryType.Search,
        description: '搜索Grafana资源',
      });
    }
    if (config.featureToggles.editPanelCSVDragAndDrop) {
      this.queryTypes.push({
        label: 'Spreadsheet or snapshot',
        value: GrafanaQueryType.Snapshot,
        description: 'Query an uploaded spreadsheet or a snapshot',
      });
    }
  }

  loadChannelInfo() {
    getBackendSrv()
      .fetch({ url: 'api/live/list' })
      .subscribe({
        next: (v: any) => {
          const channelInfo = v.data?.channels as any[];
          if (channelInfo?.length) {
            const channelFields: Record<string, Array<SelectableValue<string>>> = {};
            const channels: Array<SelectableValue<string>> = channelInfo.map((c) => {
              if (c.data) {
                const distinctFields = new Set<string>();
                const frame = dataFrameFromJSON(c.data);
                for (const f of frame.fields) {
                  distinctFields.add(f.name);
                }
                channelFields[c.channel] = Array.from(distinctFields).map((n) => ({
                  value: n,
                  label: n,
                }));
              }
              return {
                value: c.channel,
                label: c.channel + ' [' + c.minute_rate + ' msg/min]',
              };
            });

            this.setState({ channelFields, channels });
          }
        },
      });
  }

  loadFolderInfo() {
    const query: DataQueryRequest<GrafanaQuery> = {
      targets: [{ queryType: GrafanaQueryType.List, refId: 'A' }],
    } as any;

    getDataSourceSrv()
      .get('-- Grafana --')
      .then((ds) => {
        const gds = ds as GrafanaDatasource;
        gds.query(query).subscribe({
          next: (rsp) => {
            if (rsp.data.length) {
              const names = (rsp.data[0] as DataFrame).fields[0];
              const folders = names.values.map((v) => ({
                value: v,
                label: v,
              }));
              this.setState({ folders });
            }
          },
        });
      });
  }

  componentDidMount() {
    this.loadChannelInfo();
  }

  onQueryTypeChange = (sel: SelectableValue<GrafanaQueryType>) => {
    const { onChange, query, onRunQuery } = this.props;
    onChange({ ...query, queryType: sel.value! });
    onRunQuery();

    // Reload the channel list
    this.loadChannelInfo();
  };

  onChannelChange = (sel: SelectableValue<string>) => {
    const { onChange, query, onRunQuery } = this.props;
    onChange({ ...query, channel: sel?.value });
    onRunQuery();
  };

  onFieldNamesChange = (item: SelectableValue<string>) => {
    const { onChange, query, onRunQuery } = this.props;
    let fields: string[] = [];
    if (Array.isArray(item)) {
      fields = item.map((v) => v.value);
    } else if (item.value) {
      fields = [item.value];
    }

    // When adding the first field, also add time (if it exists)
    if (fields.length === 1 && !query.filter?.fields?.length && query.channel) {
      const names = this.state.channelFields[query.channel] ?? [];
      const tf = names.find((f) => f.value === 'time' || f.value === 'Time');
      if (tf && tf.value && tf.value !== fields[0]) {
        fields = [tf.value, ...fields];
      }
    }

    onChange({
      ...query,
      filter: {
        ...query.filter,
        fields,
      },
    });
    onRunQuery();
  };

  checkAndUpdateValue = (key: keyof GrafanaQuery, txt: string) => {
    const { onChange, query, onRunQuery } = this.props;
    if (key === 'buffer') {
      let buffer: number | undefined;
      if (txt) {
        try {
          buffer = rangeUtil.intervalToSeconds(txt) * 1000;
        } catch (err) {
          console.warn('ERROR', err);
        }
      }
      onChange({
        ...query,
        buffer,
      });
    } else {
      onChange({
        ...query,
        [key]: txt,
      });
    }
    onRunQuery();
  };

  handleEnterKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') {
      return;
    }
    this.checkAndUpdateValue('buffer', (e.target as any).value);
  };

  handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    this.checkAndUpdateValue('buffer', e.target.value);
  };

  renderMeasurementsQuery() {
    let { channel, filter, buffer } = this.props.query;
    let { channels, channelFields } = this.state;
    let currentChannel = channels.find((c) => c.value === channel);
    if (channel && !currentChannel) {
      currentChannel = {
        value: channel,
        label: channel,
        description: `连接到 ${channel}`,
      };
      channels = [currentChannel, ...channels];
    }

    const distinctFields = new Set<string>();
    const fields: Array<SelectableValue<string>> = channel ? channelFields[channel] ?? [] : [];
    // if (data && data.series?.length) {
    //   for (const frame of data.series) {
    //     for (const field of frame.fields) {
    //       if (distinctFields.has(field.name) || !field.name) {
    //         continue;
    //       }
    //       fields.push({
    //         value: field.name,
    //         label: field.name,
    //         description: `(${getFrameDisplayName(frame)} / ${field.type})`,
    //       });
    //       distinctFields.add(field.name);
    //     }
    //   }
    // }
    if (filter?.fields) {
      for (const f of filter.fields) {
        if (!distinctFields.has(f)) {
          fields.push({
            value: f,
            label: `${f} (未加载)`,
            description: `已配置，但在查询结果中找不到`,
          });
          distinctFields.add(f);
        }
      }
    }

    let formattedTime = '';
    if (buffer) {
      formattedTime = rangeUtil.secondsToHms(buffer / 1000);
    }

    return (
      <>
        <div className="gf-form">
          <InlineField label="通道" grow={true} labelWidth={labelWidth}>
            <Select
              options={channels}
              value={currentChannel || ''}
              onChange={this.onChannelChange}
              allowCustomValue={true}
              backspaceRemovesValue={true}
              placeholder="选择测量通道"
              isClearable={true}
              noOptionsMessage="输入频道名称"
              formatCreateLabel={(input: string) => `连接到: ${input}`}
            />
          </InlineField>
        </div>
        {channel && (
          <div className="gf-form">
            <InlineField label="字段" grow={true} labelWidth={labelWidth}>
              <Select
                options={fields}
                value={filter?.fields || []}
                onChange={this.onFieldNamesChange}
                allowCustomValue={true}
                backspaceRemovesValue={true}
                placeholder="All fields"
                isClearable={true}
                noOptionsMessage="Unable to list all fields"
                formatCreateLabel={(input: string) => `字段: ${input}`}
                isSearchable={true}
                isMulti={true}
              />
            </InlineField>
            <InlineField label="缓冲">
              <Input
                placeholder="自动"
                width={12}
                defaultValue={formattedTime}
                onKeyDown={this.handleEnterKey}
                onBlur={this.handleBlur}
                spellCheck={false}
              />
            </InlineField>
          </div>
        )}

        <Alert title="实时指标" severity="info">
          这支持 Grafana 核心中的实时事件流。此功能正在大量开发中。期待接口和结构随着生产就绪而改变。
        </Alert>
      </>
    );
  }

  onFolderChanged = (sel: SelectableValue<string>) => {
    const { onChange, query, onRunQuery } = this.props;
    onChange({ ...query, path: sel?.value });
    onRunQuery();
  };

  renderListPublicFiles() {
    let { path } = this.props.query;
    let { folders } = this.state;
    if (!folders) {
      folders = [];
      this.loadFolderInfo();
    }
    const currentFolder = folders.find((f) => f.value === path);
    if (path && !currentFolder) {
      folders = [
        ...folders,
        {
          value: path,
          label: path,
        },
      ];
    }

    return (
      <InlineFieldRow>
        <InlineField label="路径" grow={true} labelWidth={labelWidth}>
          <Select
            options={folders}
            value={currentFolder || ''}
            onChange={this.onFolderChanged}
            allowCustomValue={true}
            backspaceRemovesValue={true}
            placeholder="选择文件夹"
            isClearable={true}
            formatCreateLabel={(input: string) => `文件夹: ${input}`}
          />
        </InlineField>
      </InlineFieldRow>
    );
  }

  // Skip rendering the file list as we're handling that in this component instead.
  fileListRenderer = (file: DropzoneFile, removeFile: (file: DropzoneFile) => void) => {
    return null;
  };

  onFileDrop = (acceptedFiles: File[], fileRejections: FileRejection[], event: DropEvent) => {
    DFImport.filesToDataframes(acceptedFiles).subscribe((next) => {
      const snapshot: DataFrameJSON[] = [];
      next.dataFrames.forEach((df) => {
        const dataframeJson = dataFrameToJSON(df);
        snapshot.push(dataframeJson);
      });
      this.props.onChange({
        ...this.props.query,
        file: { name: next.file.name, size: next.file.size },
        queryType: GrafanaQueryType.Snapshot,
        snapshot,
      });
      this.props.onRunQuery();

      reportInteraction('grafana_datasource_drop_files', {
        number_of_files: fileRejections.length + acceptedFiles.length,
        accepted_files: acceptedFiles.map((a) => {
          return { type: a.type, size: a.size };
        }),
        rejected_files: fileRejections.map((r) => {
          return { type: r.file.type, size: r.file.size };
        }),
      });
    });
  };

  renderSnapshotQuery() {
    const { query, theme } = this.props;
    const file = query.file;
    const styles = getStyles(theme);
    const fileSize = getValueFormat('decbytes')(file ? file.size : 0);

    return (
      <>
        <InlineFieldRow>
          <InlineField label="快照" grow={true} labelWidth={labelWidth}>
            <InlineLabel>{pluralize('frame', query.snapshot?.length ?? 0, true)}</InlineLabel>
          </InlineField>
        </InlineFieldRow>
        {config.featureToggles.editPanelCSVDragAndDrop && (
          <>
            <FileDropzone
              readAs="readAsArrayBuffer"
              fileListRenderer={this.fileListRenderer}
              options={{
                onDrop: this.onFileDrop,
                maxSize: DFImport.maxFileSize,
                multiple: false,
                accept: DFImport.acceptedFiles,
              }}
            >
              <FileDropzoneDefaultChildren
                primaryText={this.props?.query?.file ? '替换文件' : '将文件拖放到此处或单击以上传'}
              />
            </FileDropzone>
            {file && (
              <div className={styles.file}>
                <span>{file?.name}</span>
                <span>
                  <span>{formattedValueToString(fileSize)}</span>
                </span>
              </div>
            )}
          </>
        )}
      </>
    );
  }

  onSearchChange = (search: SearchQuery) => {
    const { query, onChange, onRunQuery } = this.props;

    onChange({
      ...query,
      search,
    });
    onRunQuery();
  };

  render() {
    const query = {
      ...defaultQuery,
      ...this.props.query,
    };

    const { queryType } = query;

    // Only show "snapshot" when it already exists
    let queryTypes = this.queryTypes;
    if (queryType === GrafanaQueryType.Snapshot && !config.featureToggles.editPanelCSVDragAndDrop) {
      queryTypes = [
        ...this.queryTypes,
        {
          label: 'Snapshot',
          value: queryType,
        },
      ];
    }

    return (
      <>
        {queryType === GrafanaQueryType.Search && (
          <Alert title="Grafana Search" severity="info">
            Using this datasource to call the new search system is experimental, and subject to change at any time
            without notice.
          </Alert>
        )}
        <InlineFieldRow>
          <InlineField label="Query type" grow={true} labelWidth={labelWidth}>
            <Select
              options={queryTypes}
              value={queryTypes.find((v) => v.value === queryType) || queryTypes[0]}
              onChange={this.onQueryTypeChange}
            />
          </InlineField>
        </InlineFieldRow>
        {queryType === GrafanaQueryType.LiveMeasurements && this.renderMeasurementsQuery()}
        {queryType === GrafanaQueryType.List && this.renderListPublicFiles()}
        {queryType === GrafanaQueryType.Snapshot && this.renderSnapshotQuery()}
        {queryType === GrafanaQueryType.Search && (
          <SearchEditor value={query.search ?? {}} onChange={this.onSearchChange} />
        )}
      </>
    );
  }
}

export const QueryEditor = withTheme2(UnthemedQueryEditor);

function getStyles(theme: GrafanaTheme2) {
  return {
    file: css`
      width: 100%;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      padding: ${theme.spacing(2)};
      border: 1px dashed ${theme.colors.border.medium};
      background-color: ${theme.colors.background.secondary};
      margin-top: ${theme.spacing(1)};
    `,
  };
}
