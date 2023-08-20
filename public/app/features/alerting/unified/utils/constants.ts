export const RULER_NOT_SUPPORTED_MSG = 'ruler not supported';

export const RULE_LIST_POLL_INTERVAL_MS = 20000;

export const ALERTMANAGER_NAME_QUERY_KEY = 'alertmanager';
export const ALERTMANAGER_NAME_LOCAL_STORAGE_KEY = 'alerting-alertmanager';
export const SILENCES_POLL_INTERVAL_MS = 20000;
export const NOTIFICATIONS_POLL_INTERVAL_MS = 20000;
export const CONTACT_POINTS_STATE_INTERVAL_MS = 20000;

export const TIMESERIES = 'timeseries';
export const TABLE = 'table';
export const STAT = 'stat';

export enum Annotation {
  description = 'description',
  summary = 'summary',
  runbookURL = 'runbook_url',
  alertId = '__alertId__',
  dashboardUID = '__dashboardUid__',
  panelID = '__panelId__',
}

export const annotationLabels: Record<Annotation, string> = {
  [Annotation.description]: '描述',
  [Annotation.summary]: '摘要',
  [Annotation.runbookURL]: '运行手册URL',
  [Annotation.dashboardUID]: '仪表板UID',
  [Annotation.panelID]: '面板ID',
  [Annotation.alertId]: '警报ID',
};

export const annotationDescriptions: Record<Annotation, string> = {
  [Annotation.description]: '警报规则功能的说明。',
  [Annotation.summary]: '注解摘要：“对发生的事情和原因的简短摘要。',
  [Annotation.runbookURL]: '用于保存警报运行手册的网页。',
  [Annotation.dashboardUID]: '',
  [Annotation.panelID]: '',
  [Annotation.alertId]: '',
};

export const defaultAnnotations = [
  { key: Annotation.summary, value: '' },
  { key: Annotation.description, value: '' },
  { key: Annotation.runbookURL, value: '' },
];
