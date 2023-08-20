import type { Monaco } from '@grafana/ui';

import {
  alertDetailsSnippet,
  alertsLoopSnippet,
  annotationsLoopSnippet,
  commonAnnotationsLoopSnippet,
  commonLabelsLoopSnippet,
  groupLabelsLoopSnippet,
  labelsLoopSnippet,
} from './snippets';
import { SuggestionDefinition } from './suggestionDefinition';

// Suggestions available at the top level of a template
export function getGlobalSuggestions(monaco: Monaco): SuggestionDefinition[] {
  const kind = monaco.languages.CompletionItemKind.Field;

  return [
    {
      label: '警告',
      kind,
      detail: 'Alert[]',
      documentation: { value: '包含所有警报的数组' },
    },
    { label: '接收人', kind, detail: 'string' },
    { label: '状态', kind, detail: 'string' },
    { label: '组标签', kind, detail: '[]KeyValue' },
    { label: '通用标签', kind, detail: '[]KeyValue' },
    { label: '通用注解', kind, detail: '[]KeyValue' },
    { label: '外部URL', kind, detail: 'string' },
  ];
}

// Suggestions that are valid only in the scope of an alert (e.g. in the .Alerts loop)
export function getAlertSuggestions(monaco: Monaco): SuggestionDefinition[] {
  const kind = monaco.languages.CompletionItemKind.Field;

  return [
    {
      label: { label: 'Status', detail: '(Alert)', description: 'string' },
      kind,
      detail: 'string',
      documentation: { value: '警报的状态。它可以是“触发”或“解决”' },
    },
    {
      label: { label: '标签', detail: '(Alert)' },
      kind,
      detail: '[]KeyValue',
      documentation: { value: '附加到警报的一组标签。' },
    },
    {
      label: { label: 'Annotations', detail: '(Alert)' },
      kind,
      detail: '[]KeyValue',
      documentation: 'A set of annotations attached to the alert.',
    },
    {
      label: { label: '开始于', detail: '(警报)' },
      kind,
      detail: 'time.Time',
      documentation: '警报开始触发的时间。',
    },
    {
      label: { label: '结束于', detail: '(警报)' },
      kind,
      detail: 'time.Time',
      documentation:
        '仅当警报的结束时间已知时才设置。否则，设置为自收到上次警报以来的可配置超时期限。',
    },
    {
      label: { label: '生成器URL', detail: '(警报)' },
      kind,
      detail: 'string',
      documentation: '反向链接到 Grafana 或外部警报管理器。',
    },
    {
      label: { label: '静默URL', detail: '(警报)' },
      kind,
      detail: 'string',
      documentation: '链接到 Grafana 静音，并预先填充了此警报的标签。仅适用于格拉法纳托管警报。',
    },
    {
      label: { label: '仪表板URL', detail: '(警报)' },
      kind,
      detail: 'string',
      documentation: '链接到 Grafana 仪表板（如果警报规则属于一个）。仅适用于格拉法纳托管警报。',
    },
    {
      label: { label: '面板URL', detail: '(警报)' },
      kind,
      detail: 'string',
      documentation: '链接到 Grafana 仪表板面板（如果警报规则属于一个）。仅适用于格拉法纳托管警报。',
    },
    {
      label: { label: '指纹', detail: '(警报' },
      kind,
      detail: 'string',
      documentation: '可用于识别警报的指纹。',
    },
    {
      label: { label: '值字符串', detail: '(警报)' },
      kind,
      detail: 'string',
      documentation: '包含警报中每个简化表达式的标签和值的字符串。',
    },
  ];
}

// Suggestions for .Alerts
export function getAlertsSuggestions(monaco: Monaco): SuggestionDefinition[] {
  const kind = monaco.languages.CompletionItemKind.Field;

  return [
    { label: '触发', kind, detail: 'Alert[]' },
    { label: '解决', kind, detail: 'Alert[]' },
  ];
}

// Suggestions for the KeyValue types
export function getKeyValueSuggestions(monaco: Monaco): SuggestionDefinition[] {
  const kind = monaco.languages.CompletionItemKind.Field;

  return [
    { label: 'SortedPairs', kind, detail: '[]KeyValue' },
    { label: 'Names', kind, detail: '[]string' },
    { label: 'Values', kind, detail: '[]string' },
    {
      label: 'Remove',
      detail: 'KeyValue[] function(keys []string)',
      kind: monaco.languages.CompletionItemKind.Method,
    },
  ];
}

export const snippets = {
  alerts: {
    label: '警报循环',
    description: '呈现警报循环',
    snippet: alertsLoopSnippet,
  },
  alertDetails: {
    label: '警报详细信息',
    description: '呈现有关警报的所有可用信息',
    snippet: alertDetailsSnippet,
  },
  groupLabels: {
    label: '组标签循环',
    description: '呈现通过组标签的循环s',
    snippet: groupLabelsLoopSnippet,
  },
  commonLabels: {
    label: '公共标签循环',
    description: '呈现通过公共标签的循环',
    snippet: commonLabelsLoopSnippet,
  },
  commonAnnotations: {
    label: '公共注解循环',
    description: '通过公共注解呈现循环',
    snippet: commonAnnotationsLoopSnippet,
  },
  labels: {
    label: '标签循环',
    description: '呈现通过标签的循环',
    snippet: labelsLoopSnippet,
  },
  annotations: {
    label: '注解循环',
    description: '通过注解呈现循环',
    snippet: annotationsLoopSnippet,
  },
};

// Snippets
export function getSnippetsSuggestions(monaco: Monaco): SuggestionDefinition[] {
  const snippetKind = monaco.languages.CompletionItemKind.Snippet;
  const snippetInsertRule = monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet;

  const { alerts, alertDetails, groupLabels, commonLabels, commonAnnotations, labels, annotations } = snippets;

  return [
    {
      label: alerts.label,
      documentation: alerts.description,
      kind: snippetKind,
      insertText: alerts.snippet,
      insertTextRules: snippetInsertRule,
    },
    {
      label: {
        label: alertDetails.label,
        detail: '(Alert)',
      },
      documentation: alertDetails.description,
      kind: snippetKind,
      insertText: alertDetails.snippet,
      insertTextRules: snippetInsertRule,
    },
    {
      label: groupLabels.label,
      documentation: groupLabels.description,
      kind: snippetKind,
      insertText: groupLabels.snippet,
      insertTextRules: snippetInsertRule,
    },
    {
      label: commonLabels.label,
      documentation: commonLabels.description,
      kind: snippetKind,
      insertText: commonLabels.snippet,
      insertTextRules: snippetInsertRule,
    },
    {
      label: commonAnnotations.label,
      documentation: commonAnnotations.description,
      kind: snippetKind,
      insertText: commonAnnotations.snippet,
      insertTextRules: snippetInsertRule,
    },
    {
      label: { label: labels.label, detail: '(Alert)' },
      documentation: labels.description,
      kind: snippetKind,
      insertText: labels.snippet,
      insertTextRules: snippetInsertRule,
    },
    {
      label: { label: annotations.label, detail: '(Alert)' },
      documentation: annotations.description,
      kind: snippetKind,
      insertText: annotations.snippet,
      insertTextRules: snippetInsertRule,
    },
  ];
}
