export interface TemplateDataItem {
  name: string;
  type: 'string' | '[]Alert' | 'KeyValue' | 'time.Time';
  notes: string;
}

interface TemplateFunctionItem {
  name: string;
  args?: '[]string';
  returns: 'KeyValue' | '[]string';
  notes?: string;
}

export const GlobalTemplateData: TemplateDataItem[] = [
  {
    name: 'Receiver',
    type: 'string',
    notes: '要向其发送通知的联系人的名称。',
  },
  {
    name: 'Status',
    type: 'string',
    notes: '如果至少有一个警报正在触发，则触发，否则已解决',
  },
  {
    name: 'Alerts',
    type: '[]Alert',
    notes: '此通知中包含的警报对象列表.',
  },
  {
    name: 'Alerts.Firing',
    type: '[]Alert',
    notes: '触发警报列表',
  },
  {
    name: 'Alerts.Resolved',
    type: '[]Alert',
    notes: '已解决警报的列表',
  },
  {
    name: 'GroupLabels',
    type: 'KeyValue',
    notes: '这些警报的标签是按其分组的。',
  },
  {
    name: 'CommonLabels',
    type: 'KeyValue',
    notes: '此通知中包含的所有警报通用的标签。',
  },
  {
    name: 'CommonAnnotations',
    type: 'KeyValue',
    notes: '此通知中包含的所有警报通用的注解。',
  },
  {
    name: 'ExternalURL',
    type: 'string',
    notes: '指向发送通知的格拉法纳的反向链接。',
  },
];

export const AlertTemplatePreviewData: TemplateDataItem[] = [
  {
    name: 'Labels',
    type: 'KeyValue',
    notes: '附加到警报的标签集。',
  },
  {
    name: 'Annotations',
    type: 'KeyValue',
    notes: '附加到警报的注解集。',
  },
  {
    name: 'StartsAt',
    type: 'time.Time',
    notes: '警报开始触发的时间。',
  },
  {
    name: 'EndsAt',
    type: 'time.Time',
    notes: '警报结束触发的时间。',
  },
];

export const AlertTemplateData: TemplateDataItem[] = [
  {
    name: 'Status',
    type: 'string',
    notes: '触发或解决。',
  },
  {
    name: 'Labels',
    type: 'KeyValue',
    notes: '附加到警报的标签集。',
  },
  {
    name: 'Annotations',
    type: 'KeyValue',
    notes: '附加到警报的注解集。',
  },
  {
    name: 'Values',
    type: 'KeyValue',
    notes:
      '警报的所有即时查询、归约表达式和数学表达式以及经典条件的值。它不包含时间序列数据。',
  },
  {
    name: 'StartsAt',
    type: 'time.Time',
    notes: '警报开始触发的时间。',
  },
  {
    name: 'EndsAt',
    type: 'time.Time',
    notes:'仅当警报的结束时间已知时才设置。否则，设置为自收到上次警报以来的可配置超时期限。',
  },
  {
    name: 'GeneratorURL',
    type: 'string',
    notes: '指向系统或外部警报管理器的反向链接。',
  },
  {
    name: 'SilenceURL',
    type: 'string',
    notes: '链接到系统静默，并预先填充了此警报的标签。仅适用于格拉法纳托管警报。',
  },
  {
    name: 'DashboardURL',
    type: 'string',
    notes: '链接到系统仪表板（如果警报规则属于一个）。仅适用于格拉法纳托管警报。',
  },
  {
    name: 'PanelURL',
    type: 'string',
    notes: '链接到系统仪表板面板（如果警报规则属于一个）。仅适用于格拉法纳托管警报。',
  },
  {
    name: 'Fingerprint',
    type: 'string',
    notes: '可用于识别警报的指纹。',
  },
  {
    name: 'ValueString',
    type: 'string',
    notes: '包含警报中每个简化表达式的标签和值的字符串。',
  },
];

export const KeyValueTemplateFunctions: TemplateFunctionItem[] = [
  {
    name: 'SortedPairs',
    returns: 'KeyValue',
    notes: '返回键和值字符串对的排序列表',
  },
  {
    name: 'Remove',
    args: '[]string',
    returns: 'KeyValue',
    notes: '返回不带给定键的键/值映射的副本。',
  },
  {
    name: 'Names',
    returns: '[]string',
    notes: '标签名称列表',
  },
  {
    name: 'Values',
    returns: '[]string',
    notes: '标签值列表',
  },
];

export const KeyValueCodeSnippet = `{
  "summary": "警报摘要",
  "description": "警报说明"
}
`;
