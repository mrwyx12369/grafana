import { cx, css } from '@emotion/css';
import React, { ChangeEvent } from 'react';
import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd';
import { Unsubscribable } from 'rxjs';

import {
  DataFrame,
  DataTransformerConfig,
  DocsId,
  GrafanaTheme2,
  PanelData,
  SelectableValue,
  standardTransformersRegistry,
  TransformerRegistryItem,
  TransformerCategory,
  DataTransformerID,
} from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { reportInteraction } from '@grafana/runtime';
import {
  Alert,
  Button,
  ConfirmModal,
  Container,
  CustomScrollbar,
  FilterPill,
  Themeable,
  VerticalGroup,
  withTheme,
  Input,
  Icon,
  IconButton,
  useStyles2,
  Card,
  Switch,
} from '@grafana/ui';
import { LocalStorageValueProvider } from 'app/core/components/LocalStorageValueProvider';
import config from 'app/core/config';
import { getDocsLink } from 'app/core/utils/docsLinks';
import { PluginStateInfo } from 'app/features/plugins/components/PluginStateInfo';
import { categoriesLabels } from 'app/features/transformers/utils';

import { AppNotificationSeverity } from '../../../../types';
import { PanelModel } from '../../state';
import { PanelNotSupported } from '../PanelEditor/PanelNotSupported';

import { TransformationOperationRows } from './TransformationOperationRows';
import { TransformationsEditorTransformation } from './types';

const LOCAL_STORAGE_KEY = 'dashboard.components.TransformationEditor.featureInfoBox.isDismissed';

interface TransformationsEditorProps extends Themeable {
  panel: PanelModel;
}

type viewAllType = 'viewAll';
const viewAllValue = 'viewAll';
const viewAllLabel = '查看所有';

type FilterCategory = TransformerCategory | viewAllType;

const filterCategoriesLabels: Array<[FilterCategory, string]> = [
  [viewAllValue, viewAllLabel],
  ...(Object.entries(categoriesLabels) as Array<[FilterCategory, string]>),
];

interface State {
  data: DataFrame[];
  transformations: TransformationsEditorTransformation[];
  search: string;
  showPicker?: boolean;
  scrollTop?: number;
  showRemoveAllModal?: boolean;
  selectedFilter?: FilterCategory;
  showIllustrations?: boolean;
}

class UnThemedTransformationsEditor extends React.PureComponent<TransformationsEditorProps, State> {
  subscription?: Unsubscribable;

  constructor(props: TransformationsEditorProps) {
    super(props);
    const transformations = props.panel.transformations || [];

    const ids = this.buildTransformationIds(transformations);
    this.state = {
      transformations: transformations.map((t, i) => ({
        transformation: t,
        id: ids[i],
      })),
      data: [],
      search: '',
      selectedFilter: viewAllValue,
      showIllustrations: true,
    };
  }

  onSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    this.setState({ search: event.target.value });
  };

  onSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      const { search } = this.state;
      if (search) {
        const lower = search.toLowerCase();
        const filtered = standardTransformersRegistry.list().filter((t) => {
          const txt = (t.name + t.description).toLowerCase();
          return txt.indexOf(lower) >= 0;
        });
        if (filtered.length > 0) {
          this.onTransformationAdd({ value: filtered[0].id });
        }
      }
    } else if (event.keyCode === 27) {
      // Escape key
      this.setState({ search: '', showPicker: false });
      event.stopPropagation(); // don't exit the editor
    }
  };

  buildTransformationIds(transformations: DataTransformerConfig[]) {
    const transformationCounters: Record<string, number> = {};
    const transformationIds: string[] = [];

    for (let i = 0; i < transformations.length; i++) {
      const transformation = transformations[i];
      if (transformationCounters[transformation.id] === undefined) {
        transformationCounters[transformation.id] = 0;
      } else {
        transformationCounters[transformation.id] += 1;
      }
      transformationIds.push(`${transformations[i].id}-${transformationCounters[transformations[i].id]}`);
    }
    return transformationIds;
  }

  componentDidMount() {
    this.subscription = this.props.panel
      .getQueryRunner()
      .getData({ withTransforms: false, withFieldConfig: false })
      .subscribe({
        next: (panelData: PanelData) => this.setState({ data: panelData.series }),
      });
  }

  componentWillUnmount() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  componentDidUpdate(prevProps: Readonly<TransformationsEditorProps>, prevState: Readonly<State>): void {
    if (config.featureToggles.transformationsRedesign) {
      const prevHasTransforms = prevState.transformations.length > 0;
      const prevShowPicker = !prevHasTransforms || prevState.showPicker;

      const currentHasTransforms = this.state.transformations.length > 0;
      const currentShowPicker = !currentHasTransforms || this.state.showPicker;

      if (prevShowPicker !== currentShowPicker) {
        // kindOfZero will be a random number between 0 and 0.5. It will be rounded to 0 by the scrollable component.
        // We cannot always use 0 as it will not trigger a rerender of the scrollable component consistently
        // due to React changes detection algo.
        const kindOfZero = Math.random() / 2;

        this.setState({ scrollTop: currentShowPicker ? kindOfZero : Number.MAX_SAFE_INTEGER });
      }
    }
  }

  onChange(transformations: TransformationsEditorTransformation[]) {
    this.setState({ transformations });
    this.props.panel.setTransformations(transformations.map((t) => t.transformation));
  }

  // Transformation UIDs are stored in a name-X form. name is NOT unique hence we need to parse the IDs and increase X
  // for transformations with the same name
  getTransformationNextId = (name: string) => {
    const { transformations } = this.state;
    let nextId = 0;
    const existingIds = transformations.filter((t) => t.id.startsWith(name)).map((t) => t.id);

    if (existingIds.length !== 0) {
      nextId = Math.max(...existingIds.map((i) => parseInt(i.match(/\d+/)![0], 10))) + 1;
    }

    return `${name}-${nextId}`;
  };

  onTransformationAdd = (selectable: SelectableValue<string>) => {
    let eventName = 'panel_editor_tabs_transformations_management';
    if (config.featureToggles.transformationsRedesign) {
      eventName = 'transformations_redesign_' + eventName;
    }

    reportInteraction(eventName, {
      action: 'add',
      transformationId: selectable.value,
    });
    const { transformations } = this.state;

    const nextId = this.getTransformationNextId(selectable.value!);
    this.setState({ search: '', showPicker: false });
    this.onChange([
      ...transformations,
      {
        id: nextId,
        transformation: {
          id: selectable.value as string,
          options: {},
        },
      },
    ]);
  };

  onTransformationChange = (idx: number, dataConfig: DataTransformerConfig) => {
    const { transformations } = this.state;
    const next = Array.from(transformations);
    let eventName = 'panel_editor_tabs_transformations_management';
    if (config.featureToggles.transformationsRedesign) {
      eventName = 'transformations_redesign_' + eventName;
    }

    reportInteraction(eventName, {
      action: 'change',
      transformationId: next[idx].transformation.id,
    });
    next[idx].transformation = dataConfig;
    this.onChange(next);
  };

  onTransformationRemove = (idx: number) => {
    const { transformations } = this.state;
    const next = Array.from(transformations);
    let eventName = 'panel_editor_tabs_transformations_management';
    if (config.featureToggles.transformationsRedesign) {
      eventName = 'transformations_redesign_' + eventName;
    }

    reportInteraction(eventName, {
      action: 'remove',
      transformationId: next[idx].transformation.id,
    });
    next.splice(idx, 1);
    this.onChange(next);
  };

  onTransformationRemoveAll = () => {
    this.onChange([]);
    this.setState({ showRemoveAllModal: false });
  };

  onDragEnd = (result: DropResult) => {
    const { transformations } = this.state;

    if (!result || !result.destination) {
      return;
    }

    const startIndex = result.source.index;
    const endIndex = result.destination.index;
    if (startIndex === endIndex) {
      return;
    }
    const update = Array.from(transformations);
    const [removed] = update.splice(startIndex, 1);
    update.splice(endIndex, 0, removed);
    this.onChange(update);
  };

  renderTransformationEditors = () => {
    const styles = getStyles(config.theme2);
    const { data, transformations, showPicker } = this.state;
    const hide = config.featureToggles.transformationsRedesign && showPicker;

    return (
      <div className={cx({ [styles.hide]: hide })}>
        <DragDropContext onDragEnd={this.onDragEnd}>
          <Droppable droppableId="transformations-list" direction="vertical">
            {(provided) => {
              return (
                <div ref={provided.innerRef} {...provided.droppableProps}>
                  <TransformationOperationRows
                    configs={transformations}
                    data={data}
                    onRemove={this.onTransformationRemove}
                    onChange={this.onTransformationChange}
                  />
                  {provided.placeholder}
                </div>
              );
            }}
          </Droppable>
        </DragDropContext>
      </div>
    );
  };

  renderTransformsPicker() {
    const styles = getStyles(config.theme2);
    const { transformations, search } = this.state;
    let suffix: React.ReactNode = null;
    let xforms = standardTransformersRegistry.list().sort((a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0));

    if (this.state.selectedFilter !== viewAllValue) {
      xforms = xforms.filter(
        (t) =>
          t.categories &&
          this.state.selectedFilter &&
          t.categories.has(this.state.selectedFilter as TransformerCategory)
      );
    }

    if (search) {
      const lower = search.toLowerCase();
      const filtered = xforms.filter((t) => {
        const txt = (t.name + t.description).toLowerCase();
        return txt.indexOf(lower) >= 0;
      });

      suffix = (
        <>
          {filtered.length} / {xforms.length} &nbsp;&nbsp;
          <IconButton
            name="times"
            onClick={() => {
              this.setState({ search: '' });
            }}
            tooltip="清除搜索"
          />
        </>
      );

      xforms = filtered;
    }

    const noTransforms = !transformations?.length;
    const showPicker = noTransforms || this.state.showPicker;

    if (!suffix && showPicker && !noTransforms) {
      suffix = (
        <IconButton
          name="times"
          onClick={() => {
            this.setState({ showPicker: false });
          }}
          tooltip="关闭选取器"
        />
      );
    }

    return (
      <>
        {noTransforms && !config.featureToggles.transformationsRedesign && (
          <Container grow={1}>
            <LocalStorageValueProvider<boolean> storageKey={LOCAL_STORAGE_KEY} defaultValue={false}>
              {(isDismissed, onDismiss) => {
                if (isDismissed) {
                  return null;
                }

                return (
                  <Alert
                    title="转换器"
                    severity="info"
                    onRemove={() => {
                      onDismiss(true);
                    }}
                  >
                    <p>
                      转换允许您在之前联接、计算、重新排序、隐藏和重命名查询结果它们是可视化的。 <br />
                      如果您使用的是图形可视化效果，则许多转换不适合，因为它目前仅支持时序数据。 <br />
                      切换到表可视化效果有助于了解转换正在执行的操作。{' '}
                    </p>
                    <a
                      href={getDocsLink(DocsId.Transformations)}
                      className="external-link"
                      target="_blank"
                      rel="noreferrer"
                    >
                    阅读更多
                    </a>
                  </Alert>
                );
              }}
            </LocalStorageValueProvider>
          </Container>
        )}
        {showPicker ? (
          <>
            {config.featureToggles.transformationsRedesign && (
              <>
                {!noTransforms && (
                  <Button
                    variant="secondary"
                    fill="text"
                    icon="angle-left"
                    onClick={() => {
                      this.setState({ showPicker: false });
                    }}
                  >
                    返回至&nbsp;<i>当前转换</i>
                  </Button>
                )}
                <div className={styles.pickerInformationLine}>
                  <a
                    href={getDocsLink(DocsId.Transformations)}
                    className="external-link"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className={styles.pickerInformationLineHighlight}>转换</span>{' '}
                    <Icon name="external-link-alt" />
                  </a>
                  &nbsp;允许您在应用可视化之前操作数据。
                </div>
              </>
            )}
            <VerticalGroup>
              {!config.featureToggles.transformationsRedesign && (
                <Input
                  data-testid={selectors.components.Transforms.searchInput}
                  value={search ?? ''}
                  autoFocus={!noTransforms}
                  placeholder="搜索转换"
                  onChange={this.onSearchChange}
                  onKeyDown={this.onSearchKeyDown}
                  suffix={suffix}
                />
              )}

              {!config.featureToggles.transformationsRedesign &&
                xforms.map((t) => {
                  return (
                    <TransformationCard
                      key={t.name}
                      transform={t}
                      onClick={() => {
                        this.onTransformationAdd({ value: t.id });
                      }}
                    />
                  );
                })}

              {config.featureToggles.transformationsRedesign && (
                <div className={styles.searchWrapper}>
                  <Input
                    data-testid={selectors.components.Transforms.searchInput}
                    className={styles.searchInput}
                    value={search ?? ''}
                    autoFocus={!noTransforms}
                    placeholder="搜索转换"
                    onChange={this.onSearchChange}
                    onKeyDown={this.onSearchKeyDown}
                    suffix={suffix}
                  />
                  <div className={styles.showImages}>
                    <span className={styles.illustationSwitchLabel}>显示图片</span>{' '}
                    <Switch
                      value={this.state.showIllustrations}
                      onChange={() => this.setState({ showIllustrations: !this.state.showIllustrations })}
                    />
                  </div>
                </div>
              )}

              {config.featureToggles.transformationsRedesign && (
                <div className={styles.filterWrapper}>
                  {filterCategoriesLabels.map(([slug, label]) => {
                    return (
                      <FilterPill
                        key={slug}
                        onClick={() => this.setState({ selectedFilter: slug })}
                        label={label}
                        selected={this.state.selectedFilter === slug}
                      />
                    );
                  })}
                </div>
              )}

              {config.featureToggles.transformationsRedesign && (
                <TransformationsGrid
                  showIllustrations={this.state.showIllustrations}
                  transformations={xforms}
                  onClick={(id) => {
                    this.onTransformationAdd({ value: id });
                  }}
                />
              )}
            </VerticalGroup>
          </>
        ) : (
          <Button
            icon="plus"
            variant="secondary"
            onClick={() => {
              this.setState({ showPicker: true });
            }}
            data-testid={selectors.components.Transforms.addTransformationButton}
          >
            新增{config.featureToggles.transformationsRedesign ? ' 另外 ' : ' '}转换器
          </Button>
        )}
      </>
    );
  }

  render() {
    const styles = getStyles(config.theme2);
    const {
      panel: { alert },
    } = this.props;
    const { transformations } = this.state;

    const hasTransforms = transformations.length > 0;

    if (!hasTransforms && alert) {
      return <PanelNotSupported message="不能在具有现有警报的面板上使用转换" />;
    }

    return (
      <CustomScrollbar scrollTop={this.state.scrollTop} autoHeightMin="100%">
        <Container padding="lg">
          <div data-testid={selectors.components.TransformTab.content}>
            {hasTransforms && alert ? (
              <Alert
                severity={AppNotificationSeverity.Error}
                title="不能在带有警报的面板上使用转换"
              />
            ) : null}
            {hasTransforms && config.featureToggles.transformationsRedesign && !this.state.showPicker && (
              <div className={styles.listInformationLineWrapper}>
                <span className={styles.listInformationLineText}>当前使用的转换器</span>{' '}
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    this.setState({ showRemoveAllModal: true });
                  }}
                >
                  删除所有转换
                </Button>
                <ConfirmModal
                  isOpen={Boolean(this.state.showRemoveAllModal)}
                  title="删除所有转换?"
                  body="通过删除所有转换，您将返回到主选择屏幕。"
                  confirmText="确定"
                  onConfirm={() => this.onTransformationRemoveAll()}
                  onDismiss={() => this.setState({ showRemoveAllModal: false })}
                />
              </div>
            )}
            {hasTransforms && this.renderTransformationEditors()}
            {this.renderTransformsPicker()}
          </div>
        </Container>
      </CustomScrollbar>
    );
  }
}

interface TransformationCardProps {
  transform: TransformerRegistryItem<any>;
  onClick: () => void;
}

function TransformationCard({ transform, onClick }: TransformationCardProps) {
  const styles = useStyles2(getStyles);
  return (
    <Card
      className={styles.card}
      data-testid={selectors.components.TransformTab.newTransform(transform.name)}
      onClick={onClick}
    >
      <Card.Heading>{transform.name}</Card.Heading>
      <Card.Description>{transform.description}</Card.Description>
      {transform.state && (
        <Card.Tags>
          <PluginStateInfo state={transform.state} />
        </Card.Tags>
      )}
    </Card>
  );
}

const getStyles = (theme: GrafanaTheme2) => {
  return {
    hide: css`
      display: none;
    `,
    card: css`
      margin: 0;
      padding: ${theme.spacing(1)};
    `,
    grid: css`
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      grid-auto-rows: 1fr;
      gap: ${theme.spacing(2)} ${theme.spacing(1)};
      width: 100%;
    `,
    newCard: css`
      grid-template-rows: min-content 0 1fr 0;
    `,
    heading: css`
      font-weight: 400;

      > button {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: no-wrap;
      }
    `,
    description: css`
      font-size: 12px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    `,
    image: css`
      display: block;
      max-width: 100%;
      margin-top: ${theme.spacing(2)};
    `,
    searchWrapper: css`
      display: flex;
      flex-wrap: wrap;
      column-gap: 27px;
      row-gap: 16px;
      width: 100%;
    `,
    searchInput: css`
      flex-grow: 1;
      width: initial;
    `,
    showImages: css`
      flex-basis: 0;
      display: flex;
      gap: 8px;
      align-items: center;
    `,
    pickerInformationLine: css`
      font-size: 16px;
      margin-bottom: ${theme.spacing(2)};
    `,
    pickerInformationLineHighlight: css`
      vertical-align: middle;
    `,
    illustationSwitchLabel: css`
      white-space: nowrap;
    `,
    filterWrapper: css`
      padding: ${theme.spacing(1)} 0;
      display: flex;
      flex-wrap: wrap;
      row-gap: ${theme.spacing(1)};
      column-gap: ${theme.spacing(0.5)};
    `,
    listInformationLineWrapper: css`
      display: flex;
      justify-content: space-between;
      margin-bottom: 24px;
    `,
    listInformationLineText: css`
      font-size: 16px;
    `,
    pluginStateInfoWrapper: css`
      margin-left: 5px;
    `,
  };
};

interface TransformationsGridProps {
  transformations: Array<TransformerRegistryItem<any>>;
  showIllustrations?: boolean;
  onClick: (id: string) => void;
}

function TransformationsGrid({ showIllustrations, transformations, onClick }: TransformationsGridProps) {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.grid}>
      {transformations.map((transform) => (
        <Card
          key={transform.id}
          className={styles.newCard}
          data-testid={selectors.components.TransformTab.newTransform(transform.name)}
          onClick={() => onClick(transform.id)}
        >
          <Card.Heading className={styles.heading}>
            <>
              <span>{transform.name}</span>
              <span className={styles.pluginStateInfoWrapper}>
                <PluginStateInfo state={transform.state} />
              </span>
            </>
          </Card.Heading>
          <Card.Description className={styles.description}>
            <>
              <span>{getTransformationsRedesignDescriptions(transform.id)}</span>
              {showIllustrations && (
                <span>
                  <img className={styles.image} src={getImagePath(transform.id)} alt={transform.name} />
                </span>
              )}
            </>
          </Card.Description>
        </Card>
      ))}
    </div>
  );
}

const getImagePath = (id: string) => {
  const folder = config.theme2.isDark ? 'dark' : 'light';

  return `public/img/transformations/${folder}/${id}.svg`;
};

const getTransformationsRedesignDescriptions = (id: string): string => {
  const overrides: { [key: string]: string } = {
    [DataTransformerID.concatenate]: '将所有字段合并到一个框架中。',
    [DataTransformerID.configFromData]: '设置单位、最小值、最大值等。',
    [DataTransformerID.fieldLookup]: '使用字段值查找国家/地区、州或机场。',
    [DataTransformerID.filterFieldsByName]: '使用正则表达式模式删除部分查询结果。',
    [DataTransformerID.filterByRefId]: '筛选出具有多个查询的面板中的查询。',
    [DataTransformerID.filterByValue]: '使用用户定义的筛选器删除查询结果的行。',
    [DataTransformerID.groupBy]: '按字段值对数据进行分组，然后处理计算。',
    [DataTransformerID.groupingToMatrix]: '基于三个字段汇总和重新组织数据。',
    [DataTransformerID.joinByField]: '根据相关字段合并 2+ 表中的行。',
    [DataTransformerID.labelsToFields]: '按时间对系列进行分组，并将标签或标签作为字段返回.',
    [DataTransformerID.merge]: '合并多个系列。值将合并为一行。',
    [DataTransformerID.organize]: '允许用户重新排序、隐藏或重命名字段/列。',
    [DataTransformerID.partitionByValues]: '将单帧数据集拆分为多个系列。',
    [DataTransformerID.prepareTimeSeries]: '将数据框从宽格式拉伸为长格式。',
    [DataTransformerID.reduce]: '将所有行或数据点减少为单个值（例如.max平均值）。',
    [DataTransformerID.renameByRegex]: '将所有行或数据点减少为单个值（例如.max平均值）。',
    [DataTransformerID.seriesToRows]: '合并多个系列。以行形式返回时间、指标和值。',
  };

  return overrides[id] || standardTransformersRegistry.getIfExists(id)?.description || '';
};

export const TransformationsEditor = withTheme(UnThemedTransformationsEditor);
