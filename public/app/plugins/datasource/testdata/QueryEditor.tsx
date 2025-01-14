import React, { FormEvent, useMemo } from 'react';
import { useAsync } from 'react-use';

import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { selectors as editorSelectors } from '@grafana/e2e-selectors';
import { InlineField, InlineFieldRow, InlineSwitch, Input, Select, Icon, TextArea } from '@grafana/ui';

import { RandomWalkEditor, StreamingClientEditor } from './components';
import { CSVContentEditor } from './components/CSVContentEditor';
import { CSVFileEditor } from './components/CSVFileEditor';
import { CSVWavesEditor } from './components/CSVWaveEditor';
import ErrorEditor from './components/ErrorEditor';
import { GrafanaLiveEditor } from './components/GrafanaLiveEditor';
import { NodeGraphEditor } from './components/NodeGraphEditor';
import { PredictablePulseEditor } from './components/PredictablePulseEditor';
import { RawFrameEditor } from './components/RawFrameEditor';
import { SimulationQueryEditor } from './components/SimulationQueryEditor';
import { USAQueryEditor, usaQueryModes } from './components/USAQueryEditor';
import { defaultCSVWaveQuery, defaultPulseQuery, defaultQuery } from './constants';
import { CSVWave, NodesQuery, TestData, TestDataQueryType, USAQuery } from './dataquery.gen';
import { TestDataDataSource } from './datasource';
import { defaultStreamQuery } from './runStreams';

const endpoints = [
  { value: 'datasources', label: 'Data Sources' },
  { value: 'search', label: 'Search' },
  { value: 'annotations', label: 'Annotations' },
];

const selectors = editorSelectors.components.DataSource.TestData.QueryTab;

export interface EditorProps {
  onChange: (value: any) => void;
  query: TestData;
  ds: TestDataDataSource;
}

export type Props = QueryEditorProps<TestDataDataSource, TestData>;

export const QueryEditor = ({ query, datasource, onChange, onRunQuery }: Props) => {
  query = { ...defaultQuery, ...query };

  const { loading, value: scenarioList } = useAsync(async () => {
    // migrate manual_entry (unusable since 7, removed in 8)
    if (query.scenarioId === TestDataQueryType.ManualEntry && query.points) {
      let csvContent = 'Time,Value\n';
      for (const point of query.points) {
        csvContent += `${point[1]},${point[0]}\n`;
      }
      onChange({
        refId: query.refId,
        datasource: query.datasource,
        scenarioId: TestDataQueryType.CSVContent,
        csvContent,
      });
    }

    const vals = await datasource.getScenarios();
    const hideAlias = [TestDataQueryType.Simulation, TestDataQueryType.Annotations];
    return vals.map((v) => ({
      ...v,
      hideAliasField: hideAlias.includes(v.id as TestDataQueryType),
    }));
  }, []);

  const onUpdate = (query: TestData) => {
    onChange(query);
    onRunQuery();
  };

  const currentScenario = useMemo(
    () => scenarioList?.find((scenario) => scenario.id === query.scenarioId),
    [scenarioList, query]
  );
  const scenarioId = currentScenario?.id;
  const description = currentScenario?.description;

  const onScenarioChange = (item: SelectableValue<string>) => {
    const scenario = scenarioList?.find((sc) => sc.id === item.value);

    if (!scenario) {
      return;
    }

    // Clear model from existing props that belong to other scenarios
    const update: TestData = {
      scenarioId: item.value! as TestDataQueryType,
      refId: query.refId,
      alias: query.alias,
      datasource: query.datasource,
    };

    if (scenario.stringInput) {
      update.stringInput = scenario.stringInput;
    }

    switch (scenario.id) {
      case TestDataQueryType.GrafanaAPI:
        update.stringInput = 'datasources';
        break;
      case TestDataQueryType.StreamingClient:
        update.stream = defaultStreamQuery;
        break;
      case TestDataQueryType.Live:
        update.channel = 'random-2s-stream'; // default stream
        break;
      case TestDataQueryType.Simulation:
        update.sim = { key: { type: 'flight', tick: 10 } }; // default stream
        break;
      case TestDataQueryType.PredictablePulse:
        update.pulseWave = defaultPulseQuery;
        break;
      case TestDataQueryType.PredictableCSVWave:
        update.csvWave = defaultCSVWaveQuery;
        break;
      case TestDataQueryType.Annotations:
        update.lines = 10;
        break;
      case TestDataQueryType.USA:
        update.usa = {
          mode: usaQueryModes[0].value,
        };
    }

    onUpdate(update);
  };

  const onInputChange = (e: FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.currentTarget;
    let newValue: any = value;

    if (type === 'number') {
      newValue = Number(value);
    }

    if (name === 'levelColumn' && e.currentTarget instanceof HTMLInputElement) {
      newValue = e.currentTarget.checked;
    }

    onUpdate({ ...query, [name]: newValue });
  };

  const onFieldChange = (field: string) => (e: { target: { name: string; value: string; type: string } }) => {
    const { name, value, type } = e.target;
    let newValue: any = value;

    if (type === 'number') {
      newValue = Number(value);
    }

    onUpdate({ ...query, [field]: { ...(query as any)[field], [name]: newValue } });
  };

  const onEndPointChange = ({ value }: SelectableValue) => {
    onUpdate({ ...query, stringInput: value });
  };

  const onStreamClientChange = onFieldChange('stream');
  const onPulseWaveChange = onFieldChange('pulseWave');
  const onUSAStatsChange = (usa?: USAQuery) => {
    onUpdate({ ...query, usa });
  };

  const onCSVWaveChange = (csvWave?: CSVWave[]) => {
    onUpdate({ ...query, csvWave });
  };

  const options = useMemo(
    () =>
      (scenarioList || [])
        .map((item) => ({ label: item.name, value: item.id }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [scenarioList]
  );

  // Common options that can be added to various scenarios
  const show = useMemo(() => {
    const scenarioId = query.scenarioId ?? '';
    return {
      labels: ['random_walk', 'predictable_pulse'].includes(scenarioId),
      dropPercent: ['csv_content', 'csv_file'].includes(scenarioId),
    };
  }, [query?.scenarioId]);

  if (loading) {
    return null;
  }

  return (
    <>
      <InlineFieldRow aria-label={selectors.scenarioSelectContainer}>
        <InlineField labelWidth={14} label="场景">
          <Select
            inputId={`test-data-scenario-select-${query.refId}`}
            options={options}
            value={options.find((item) => item.value === query.scenarioId)}
            onChange={onScenarioChange}
            width={32}
          />
        </InlineField>
        {currentScenario?.stringInput && (
          <InlineField label="字符串输入">
            <Input
              width={32}
              id={`stringInput-${query.refId}`}
              name="stringInput"
              placeholder={query.stringInput}
              value={query.stringInput}
              onChange={onInputChange}
            />
          </InlineField>
        )}
        {Boolean(!currentScenario?.hideAliasField) && (
          <InlineField label="Alias" labelWidth={14}>
            <Input
              width={32}
              id={`alias-${query.refId}`}
              type="text"
              placeholder="可选"
              pattern='[^<>&\\"]+'
              name="alias"
              value={query.alias}
              onChange={onInputChange}
            />
          </InlineField>
        )}
        {show.dropPercent && (
          <InlineField label="Drop" tooltip={'随机丢弃一组点'}>
            <Input
              type="number"
              min={0}
              max={100}
              step={5}
              width={8}
              onChange={onInputChange}
              name="dropPercent"
              placeholder="0"
              value={query.dropPercent}
              suffix={<Icon name="percentage" />}
            />
          </InlineField>
        )}
        {show.labels && (
          <InlineField
            label="标签"
            labelWidth={14}
            tooltip={
              <>
                Set labels using a key=value syntax:
                <br />
                {`{ key = "value", key2 = "value" }`}
                <br />
                key=&quot;value&quot;, key2=&quot;value&quot;
                <br />
                key=value, key2=value
                <br />
                值可以包含模板：
                <br />
                $seriesIndex - 替换为系列的索引
              </>
            }
          >
            <Input
              width={32}
              id={`labels-${query.refId}`}
              name="labels"
              onChange={onInputChange}
              value={query?.labels}
              placeholder="key=value, key2=value2"
            />
          </InlineField>
        )}
      </InlineFieldRow>

      {scenarioId === TestDataQueryType.RandomWalk && (
        <RandomWalkEditor onChange={onInputChange} query={query} ds={datasource} />
      )}
      {scenarioId === TestDataQueryType.StreamingClient && (
        <StreamingClientEditor onChange={onStreamClientChange} query={query} ds={datasource} />
      )}
      {scenarioId === TestDataQueryType.Live && <GrafanaLiveEditor onChange={onUpdate} query={query} ds={datasource} />}
      {scenarioId === TestDataQueryType.Simulation && (
        <SimulationQueryEditor onChange={onUpdate} query={query} ds={datasource} />
      )}
      {scenarioId === TestDataQueryType.RawFrame && (
        <RawFrameEditor onChange={onUpdate} query={query} ds={datasource} />
      )}
      {scenarioId === TestDataQueryType.CSVFile && <CSVFileEditor onChange={onUpdate} query={query} ds={datasource} />}
      {scenarioId === TestDataQueryType.CSVContent && (
        <CSVContentEditor onChange={onUpdate} query={query} ds={datasource} />
      )}
      {scenarioId === TestDataQueryType.Logs && (
        <InlineFieldRow>
          <InlineField label="Lines" labelWidth={14}>
            <Input
              type="number"
              name="lines"
              value={query.lines}
              width={32}
              onChange={onInputChange}
              placeholder="10"
            />
          </InlineField>
          <InlineField label="Level" labelWidth={14}>
            <InlineSwitch onChange={onInputChange} name="levelColumn" value={!!query.levelColumn} />
          </InlineField>
        </InlineFieldRow>
      )}
      {scenarioId === TestDataQueryType.Annotations && (
        <InlineFieldRow>
          <InlineField label="Count" labelWidth={14}>
            <Input
              type="number"
              name="lines"
              value={query.lines}
              width={32}
              onChange={onInputChange}
              placeholder="10"
            />
          </InlineField>
        </InlineFieldRow>
      )}
      {scenarioId === TestDataQueryType.USA && <USAQueryEditor onChange={onUSAStatsChange} query={query.usa ?? {}} />}
      {scenarioId === TestDataQueryType.GrafanaAPI && (
        <InlineField labelWidth={14} label="Endpoint">
          <Select
            options={endpoints}
            onChange={onEndPointChange}
            width={32}
            value={endpoints.find((ep) => ep.value === query.stringInput)}
          />
        </InlineField>
      )}

      {scenarioId === TestDataQueryType.Arrow && (
        <InlineField grow>
          <TextArea
            name="stringInput"
            value={query.stringInput}
            rows={10}
            placeholder="Copy base64 text data from query result"
            onChange={onInputChange}
          />
        </InlineField>
      )}

      {scenarioId === TestDataQueryType.FlameGraph && (
        <InlineField label={'Diff profile'} grow>
          <InlineSwitch
            value={Boolean(query.flamegraphDiff)}
            onChange={(e) => {
              onUpdate({ ...query, flamegraphDiff: e.currentTarget.checked });
            }}
          />
        </InlineField>
      )}

      {scenarioId === TestDataQueryType.PredictablePulse && (
        <PredictablePulseEditor onChange={onPulseWaveChange} query={query} ds={datasource} />
      )}
      {scenarioId === TestDataQueryType.PredictableCSVWave && (
        <CSVWavesEditor onChange={onCSVWaveChange} waves={query.csvWave} />
      )}
      {scenarioId === TestDataQueryType.NodeGraph && (
        <NodeGraphEditor onChange={(val: NodesQuery) => onChange({ ...query, nodes: val })} query={query} />
      )}
      {scenarioId === TestDataQueryType.ServerError500 && (
        <ErrorEditor onChange={onUpdate} query={query} ds={datasource} />
      )}
      {scenarioId === TestDataQueryType.Trace && (
        <InlineField labelWidth={14} label="Span count">
          <Input
            type="number"
            name="spanCount"
            value={query.spanCount}
            width={32}
            onChange={onInputChange}
            placeholder="10"
          />
        </InlineField>
      )}

      {description && <p>{description}</p>}
    </>
  );
};
