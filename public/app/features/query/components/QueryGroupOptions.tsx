import { css } from '@emotion/css';
import React, { PureComponent, ChangeEvent, FocusEvent } from 'react';

import { rangeUtil, PanelData, DataSourceApi } from '@grafana/data';
import { Switch, Input, InlineFormLabel, stylesFactory } from '@grafana/ui';
import { QueryOperationRow } from 'app/core/components/QueryOperationRow/QueryOperationRow';
import { config } from 'app/core/config';
import { QueryGroupOptions } from 'app/types';

interface Props {
  options: QueryGroupOptions;
  dataSource: DataSourceApi;
  data: PanelData;
  onChange: (options: QueryGroupOptions) => void;
}

interface State {
  timeRangeFrom: string;
  timeRangeShift: string;
  timeRangeHide: boolean;
  isOpen: boolean;
  relativeTimeIsValid: boolean;
  timeShiftIsValid: boolean;
}

export class QueryGroupOptionsEditor extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    const { options } = props;

    this.state = {
      timeRangeFrom: options.timeRange?.from || '',
      timeRangeShift: options.timeRange?.shift || '',
      timeRangeHide: options.timeRange?.hide ?? false,
      isOpen: false,
      relativeTimeIsValid: true,
      timeShiftIsValid: true,
    };
  }

  onRelativeTimeChange = (event: ChangeEvent<HTMLInputElement>) => {
    this.setState({
      timeRangeFrom: event.target.value,
    });
  };

  onTimeShiftChange = (event: ChangeEvent<HTMLInputElement>) => {
    this.setState({
      timeRangeShift: event.target.value,
    });
  };

  onOverrideTime = (event: FocusEvent<HTMLInputElement>) => {
    const { options, onChange } = this.props;

    const newValue = emptyToNull(event.target.value);
    const isValid = timeRangeValidation(newValue);

    if (isValid && options.timeRange?.from !== newValue) {
      onChange({
        ...options,
        timeRange: {
          ...(options.timeRange ?? {}),
          from: newValue,
        },
      });
    }

    this.setState({ relativeTimeIsValid: isValid });
  };

  onTimeShift = (event: FocusEvent<HTMLInputElement>) => {
    const { options, onChange } = this.props;

    const newValue = emptyToNull(event.target.value);
    const isValid = timeRangeValidation(newValue);

    if (isValid && options.timeRange?.shift !== newValue) {
      onChange({
        ...options,
        timeRange: {
          ...(options.timeRange ?? {}),
          shift: newValue,
        },
      });
    }

    this.setState({ timeShiftIsValid: isValid });
  };

  onToggleTimeOverride = () => {
    const { onChange, options } = this.props;

    this.setState({ timeRangeHide: !this.state.timeRangeHide }, () => {
      onChange({
        ...options,
        timeRange: {
          ...(options.timeRange ?? {}),
          hide: this.state.timeRangeHide,
        },
      });
    });
  };

  onCacheTimeoutBlur = (event: ChangeEvent<HTMLInputElement>) => {
    const { options, onChange } = this.props;
    onChange({
      ...options,
      cacheTimeout: emptyToNull(event.target.value),
    });
  };

  onQueryCachingTTLBlur = (event: ChangeEvent<HTMLInputElement>) => {
    const { options, onChange } = this.props;

    let ttl: number | null = parseInt(event.target.value, 10);

    if (isNaN(ttl) || ttl === 0) {
      ttl = null;
    }

    onChange({
      ...options,
      queryCachingTTL: ttl,
    });
  };

  onMaxDataPointsBlur = (event: ChangeEvent<HTMLInputElement>) => {
    const { options, onChange } = this.props;

    let maxDataPoints: number | null = parseInt(event.currentTarget.value, 10);

    if (isNaN(maxDataPoints) || maxDataPoints === 0) {
      maxDataPoints = null;
    }

    if (maxDataPoints !== options.maxDataPoints) {
      onChange({
        ...options,
        maxDataPoints,
      });
    }
  };

  onMinIntervalBlur = (event: ChangeEvent<HTMLInputElement>) => {
    const { options, onChange } = this.props;
    const minInterval = emptyToNull(event.target.value);
    if (minInterval !== options.minInterval) {
      onChange({
        ...options,
        minInterval,
      });
    }
  };

  renderCacheTimeoutOption() {
    const { dataSource, options } = this.props;

    const tooltip = `如果时序存储具有查询缓存，则此选项可以替代默认缓存超时。指定一个以秒为单位的数值。`;

    if (!dataSource.meta.queryOptions?.cacheTimeout) {
      return null;
    }

    return (
      <div className="gf-form-inline">
        <div className="gf-form">
          <InlineFormLabel width={9} tooltip={tooltip}>
            缓存超时时间
          </InlineFormLabel>
          <Input
            type="text"
            className="width-6"
            placeholder="60"
            spellCheck={false}
            onBlur={this.onCacheTimeoutBlur}
            defaultValue={options.cacheTimeout ?? ''}
          />
        </div>
      </div>
    );
  }

  renderQueryCachingTTLOption() {
    const { dataSource, options } = this.props;

    const tooltip = `缓存生存时间：此面板中此查询的结果将缓存多长时间（以毫秒为单位）。默认为此数据源的缓存配置中的 TTL。`;

    if (!dataSource.cachingConfig?.enabled) {
      return null;
    }

    return (
      <div className="gf-form-inline">
        <div className="gf-form">
          <InlineFormLabel width={9} tooltip={tooltip}>
            缓存TTL
          </InlineFormLabel>
          <Input
            type="number"
            className="width-6"
            placeholder={`${dataSource.cachingConfig.TTLMs}`}
            spellCheck={false}
            onBlur={this.onQueryCachingTTLBlur}
            defaultValue={options.queryCachingTTL ?? undefined}
          />
        </div>
      </div>
    );
  }

  renderMaxDataPointsOption() {
    const { data, options } = this.props;
    const realMd = data.request?.maxDataPoints;
    const value = options.maxDataPoints ?? '';
    const isAuto = value === '';

    return (
      <div className="gf-form-inline">
        <div className="gf-form">
          <InlineFormLabel
            width={9}
            tooltip={
              <>
              每个系列的最大数据点。由某些数据源直接使用，用于自动计算间隔。对于流数据，此值用于滚动缓冲区。
              </>
            }
          >
            最大数据点
          </InlineFormLabel>
          <Input
            type="number"
            className="width-6"
            placeholder={`${realMd}`}
            spellCheck={false}
            onBlur={this.onMaxDataPointsBlur}
            defaultValue={value}
          />
          {isAuto && (
            <>
              <div className="gf-form-label query-segment-operator">=</div>
              <div className="gf-form-label">面板宽度</div>
            </>
          )}
        </div>
      </div>
    );
  }

  renderIntervalOption() {
    const { data, dataSource, options } = this.props;
    const realInterval = data.request?.interval;
    const minIntervalOnDs = dataSource.interval ?? '无限制';

    return (
      <>
        <div className="gf-form-inline">
          <div className="gf-form">
            <InlineFormLabel
              width={9}
              tooltip={
                <>
                间隔的下限。建议设置为写入频率，例如 <code>1m</code>{' '}如果您的数据每分钟写入一次。可以在大多数数据的数据源设置中设置默认值来源。
                </>
              }
            >
              最小间隔
            </InlineFormLabel>
            <Input
              type="text"
              className="width-6"
              placeholder={`${minIntervalOnDs}`}
              spellCheck={false}
              onBlur={this.onMinIntervalBlur}
              defaultValue={options.minInterval ?? ''}
            />
          </div>
        </div>
        <div className="gf-form-inline">
          <div className="gf-form">
            <InlineFormLabel
              width={9}
              tooltip={
                <>
                发送到数据源并在 <code>$__interval</code> 和 {' '} 中使用的评估间隔<code>__interval_ms美元</code>。此值不完全等于 {' '}<code>时间范围/最大数据点</code>，它将近似一系列幻数。
                </>
              }
            >
              时间间隔
            </InlineFormLabel>
            <InlineFormLabel width={6}>{realInterval}</InlineFormLabel>
            <div className="gf-form-label query-segment-operator">=</div>
            <div className="gf-form-label">时间范围/最大数据点</div>
          </div>
        </div>
      </>
    );
  }

  onOpenOptions = () => {
    this.setState({ isOpen: true });
  };

  onCloseOptions = () => {
    this.setState({ isOpen: false });
  };

  renderCollapsedText(styles: StylesType): React.ReactNode | undefined {
    const { data, options } = this.props;
    const { isOpen } = this.state;

    if (isOpen) {
      return undefined;
    }

    let mdDesc = options.maxDataPoints ?? '';
    if (mdDesc === '' && data.request) {
      mdDesc = `auto = ${data.request.maxDataPoints}`;
    }

    let intervalDesc = options.minInterval;
    if (data.request) {
      intervalDesc = `${data.request.interval}`;
    }

    return (
      <>
        {<div className={styles.collapsedText}>MD = {mdDesc}</div>}
        {<div className={styles.collapsedText}>间隔 = {intervalDesc}</div>}
      </>
    );
  }

  render() {
    const { timeRangeHide: hideTimeOverride, relativeTimeIsValid, timeShiftIsValid } = this.state;
    const { timeRangeFrom: relativeTime, timeRangeShift: timeShift, isOpen } = this.state;
    const styles = getStyles();

    return (
      <QueryOperationRow
        id="Query options"
        index={0}
        title="查询选项"
        headerElement={this.renderCollapsedText(styles)}
        isOpen={isOpen}
        onOpen={this.onOpenOptions}
        onClose={this.onCloseOptions}
      >
        {this.renderMaxDataPointsOption()}
        {this.renderIntervalOption()}
        {this.renderCacheTimeoutOption()}
        {this.renderQueryCachingTTLOption()}

        <div className="gf-form">
          <InlineFormLabel
            width={9}
            tooltip={
              <>
              覆盖单个面板的相对时间范围，这会导致它们与在仪表板右上角的仪表板时间选取器中选择。例如，要配置过去 5 分钟相对时间应为<code>现在-5m</code> 和 <code>5m</code>，或变量喜欢 <code>$_relativeTime</code>.
              </>
            }
          >
            相对时间
          </InlineFormLabel>
          <Input
            type="text"
            className="width-6"
            placeholder="1小时"
            onChange={this.onRelativeTimeChange}
            onBlur={this.onOverrideTime}
            invalid={!relativeTimeIsValid}
            value={relativeTime}
          />
        </div>

        <div className="gf-form">
          <InlineFormLabel
            width={9}
            tooltip={
              <>
              通过相对于时间移动单个面板的开始和结束来覆盖其时间范围拾取器。例如，要配置过去 1 小时，时移应为 <code>now-1h</code> 和 {' '}<code>1h</code> 或 <code>$_timeShift</code> 等变量。
              </>
            }
          >
            时间移动
          </InlineFormLabel>
          <Input
            type="text"
            className="width-6"
            placeholder="1小时"
            onChange={this.onTimeShiftChange}
            onBlur={this.onTimeShift}
            invalid={!timeShiftIsValid}
            value={timeShift}
          />
        </div>
        {(timeShift || relativeTime) && (
          <div className="gf-form-inline align-items-center">
            <InlineFormLabel width={9}>Hide time info</InlineFormLabel>
            <Switch value={hideTimeOverride} onChange={this.onToggleTimeOverride} />
          </div>
        )}
      </QueryOperationRow>
    );
  }
}

const timeRangeValidation = (value: string | null) => {
  if (!value) {
    return true;
  }

  return rangeUtil.isValidTimeSpan(value);
};

const emptyToNull = (value: string) => {
  return value === '' ? null : value;
};

const getStyles = stylesFactory(() => {
  const { theme } = config;

  return {
    collapsedText: css`
      margin-left: ${theme.spacing.md};
      font-size: ${theme.typography.size.sm};
      color: ${theme.colors.textWeak};
    `,
  };
});

type StylesType = ReturnType<typeof getStyles>;
