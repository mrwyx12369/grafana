import { css } from '@emotion/css';
import React, { useMemo, useState } from 'react';
import { useAsync } from 'react-use';

import {
  AnnotationQuery,
  DataSourceInstanceSettings,
  getDataSourceRef,
  GrafanaTheme2,
  SelectableValue,
} from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { Stack } from '@grafana/experimental';
import { getDataSourceSrv, locationService } from '@grafana/runtime';
import { AnnotationPanelFilter } from '@grafana/schema/src/raw/dashboard/x/dashboard_types.gen';
import {
  Button,
  Checkbox,
  Field,
  FieldSet,
  HorizontalGroup,
  Input,
  MultiSelect,
  Select,
  useStyles2,
} from '@grafana/ui';
import { ColorValueEditor } from 'app/core/components/OptionsUI/color';
import config from 'app/core/config';
import StandardAnnotationQueryEditor from 'app/features/annotations/components/StandardAnnotationQueryEditor';
import { DataSourcePicker } from 'app/features/datasources/components/picker/DataSourcePicker';

import { DashboardModel } from '../../state/DashboardModel';

import { AngularEditorLoader } from './AngularEditorLoader';

type Props = {
  editIdx: number;
  dashboard: DashboardModel;
};

export const newAnnotationName = 'New annotation';

export const AnnotationSettingsEdit = ({ editIdx, dashboard }: Props) => {
  const styles = useStyles2(getStyles);
  const [annotation, setAnnotation] = useState(dashboard.annotations.list[editIdx]);

  const panelFilter = useMemo(() => {
    if (!annotation.filter) {
      return PanelFilterType.AllPanels;
    }
    return annotation.filter.exclude ? PanelFilterType.ExcludePanels : PanelFilterType.IncludePanels;
  }, [annotation.filter]);

  const { value: ds } = useAsync(() => {
    return getDataSourceSrv().get(annotation.datasource);
  }, [annotation.datasource]);

  const dsi = getDataSourceSrv().getInstanceSettings(annotation.datasource);

  const onUpdate = (annotation: AnnotationQuery) => {
    const list = [...dashboard.annotations.list];
    list.splice(editIdx, 1, annotation);
    setAnnotation(annotation);
    dashboard.annotations.list = list;
  };

  const onNameChange = (ev: React.FocusEvent<HTMLInputElement>) => {
    onUpdate({
      ...annotation,
      name: ev.currentTarget.value,
    });
  };

  const onDataSourceChange = (ds: DataSourceInstanceSettings) => {
    onUpdate({
      ...annotation,
      datasource: getDataSourceRef(ds),
    });
  };

  const onChange = (ev: React.FocusEvent<HTMLInputElement>) => {
    const target = ev.currentTarget;
    onUpdate({
      ...annotation,
      [target.name]: target.type === 'checkbox' ? target.checked : target.value,
    });
  };

  const onColorChange = (color?: string) => {
    onUpdate({
      ...annotation,
      iconColor: color!,
    });
  };

  const onFilterTypeChange = (v: SelectableValue<PanelFilterType>) => {
    let filter =
      v.value === PanelFilterType.AllPanels
        ? undefined
        : {
            exclude: v.value === PanelFilterType.ExcludePanels,
            ids: annotation.filter?.ids ?? [],
          };
    onUpdate({ ...annotation, filter });
  };

  const onAddFilterPanelID = (selections: Array<SelectableValue<number>>) => {
    if (!Array.isArray(selections)) {
      return;
    }

    const filter: AnnotationPanelFilter = {
      exclude: panelFilter === PanelFilterType.ExcludePanels,
      ids: [],
    };

    selections.forEach((selection) => selection.value && filter.ids.push(selection.value));
    onUpdate({ ...annotation, filter });
  };

  const onApply = goBackToList;

  const onPreview = () => {
    locationService.partial({ editview: null, editIndex: null });
  };

  const onDelete = () => {
    const annotations = dashboard.annotations.list;
    dashboard.annotations.list = [...annotations.slice(0, editIdx), ...annotations.slice(editIdx + 1)];
    goBackToList();
  };

  const isNewAnnotation = annotation.name === newAnnotationName;

  const sortFn = (a: SelectableValue<number>, b: SelectableValue<number>) => {
    if (a.label && b.label) {
      return a.label.toLowerCase().localeCompare(b.label.toLowerCase());
    }

    return -1;
  };

  const panels: Array<SelectableValue<number>> = useMemo(
    () =>
      dashboard?.panels
        // Filtering out rows at the moment, revisit to only include panels that support annotations
        // However the information to know if a panel supports annotations requires it to be already loaded
        // panel.plugin?.dataSupport?.annotations
        .filter((panel) => config.panels[panel.type])
        .map((panel) => ({
          value: panel.id,
          label: panel.title ?? `Panel ${panel.id}`,
          description: panel.description,
          imgUrl: config.panels[panel.type].info.logos.small,
        }))
        .sort(sortFn) ?? [],
    [dashboard]
  );

  return (
    <div>
      <FieldSet className={styles.settingsForm}>
        <Field label="名称">
          <Input
            aria-label={selectors.pages.Dashboard.Settings.Annotations.Settings.name}
            name="name"
            id="name"
            autoFocus={isNewAnnotation}
            value={annotation.name}
            onChange={onNameChange}
          />
        </Field>
        <Field label="数据源" htmlFor="data-source-picker">
          <DataSourcePicker annotations variables current={annotation.datasource} onChange={onDataSourceChange} />
        </Field>
        <Field label="启用" description="启用后，每次仪表板刷新都会发出注释查询">
          <Checkbox name="enable" id="enable" value={annotation.enable} onChange={onChange} />
        </Field>
        <Field
          label="隐藏"
          description="可以在仪表板顶部打开或关闭注释查询。选中此选项后，此切换将被隐藏。"
        >
          <Checkbox name="hide" id="hide" value={annotation.hide} onChange={onChange} />
        </Field>
        <Field label="Color" description="用于注释事件标记的颜色">
          <HorizontalGroup>
            <ColorValueEditor value={annotation?.iconColor} onChange={onColorChange} />
          </HorizontalGroup>
        </Field>
        <Field label="显示于" aria-label={selectors.pages.Dashboard.Settings.Annotations.NewAnnotation.showInLabel}>
          <>
            <Select
              options={panelFilters}
              value={panelFilter}
              onChange={onFilterTypeChange}
              aria-label={selectors.components.Annotations.annotationsTypeInput}
            />
            {panelFilter !== PanelFilterType.AllPanels && (
              <MultiSelect
                options={panels}
                value={panels.filter((panel) => annotation.filter?.ids.includes(panel.value!))}
                onChange={onAddFilterPanelID}
                isClearable={true}
                placeholder="选择面板"
                width={100}
                closeMenuOnSelect={false}
                className={styles.select}
                aria-label={selectors.components.Annotations.annotationsChoosePanelInput}
              />
            )}
          </>
        </Field>
      </FieldSet>
      <FieldSet>
        <h3 className="page-heading">Query</h3>
        {ds?.annotations && dsi && (
          <StandardAnnotationQueryEditor
            datasource={ds}
            datasourceInstanceSettings={dsi}
            annotation={annotation}
            onChange={onUpdate}
          />
        )}
        {ds && !ds.annotations && <AngularEditorLoader datasource={ds} annotation={annotation} onChange={onUpdate} />}
      </FieldSet>
      <Stack>
        {!annotation.builtIn && (
          <Button variant="destructive" onClick={onDelete}>
            删除
          </Button>
        )}
        <Button
          variant="secondary"
          onClick={onPreview}
          data-testid={selectors.pages.Dashboard.Settings.Annotations.NewAnnotation.previewInDashboard}
        >
          在仪表板中预览
        </Button>
        <Button variant="primary" onClick={onApply}>
          应用
        </Button>
      </Stack>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  return {
    settingsForm: css({
      maxWidth: theme.spacing(60),
      marginBottom: theme.spacing(2),
    }),
    select: css`
      margin-top: 8px;
    `,
  };
};

function goBackToList() {
  locationService.partial({ editIndex: null });
}

// Synthetic type
enum PanelFilterType {
  AllPanels,
  IncludePanels,
  ExcludePanels,
}

const panelFilters = [
  {
    label: 'All panels',
    value: PanelFilterType.AllPanels,
    description: 'Send the annotation data to all panels that support annotations',
  },
  {
    label: 'Selected panels',
    value: PanelFilterType.IncludePanels,
    description: 'Send the annotations to the explicitly listed panels',
  },
  {
    label: 'All panels except',
    value: PanelFilterType.ExcludePanels,
    description: 'Do not send annotation data to the following panels',
  },
];
