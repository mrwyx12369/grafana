import { css } from '@emotion/css';
import React from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';

import { TimeOptions } from '../../types/time';

export function PromDurationDocs() {
  const styles = useStyles2(getPromDurationStyles);
  return (
    <div>
      Prometheus持续时间格式由一个数字后跟一个时间单位组成。
      <br />
      可以组合不同的单元以获得更精细的粒度。
      <hr />
      <div className={styles.list}>
        <div className={styles.header}>
          <div>符号</div>
          <div>时间单位</div>
          <div>示例</div>
        </div>
        <PromDurationDocsTimeUnit unit={TimeOptions.seconds} name="seconds" example="20s" />
        <PromDurationDocsTimeUnit unit={TimeOptions.minutes} name="minutes" example="10m" />
        <PromDurationDocsTimeUnit unit={TimeOptions.hours} name="hours" example="4h" />
        <PromDurationDocsTimeUnit unit={TimeOptions.days} name="days" example="3d" />
        <PromDurationDocsTimeUnit unit={TimeOptions.weeks} name="weeks" example="2w" />
        <div className={styles.examples}>
          <div>多个单位组合</div>
          <code>1m30s, 2h30m20s, 1w2d</code>
        </div>
      </div>
    </div>
  );
}

function PromDurationDocsTimeUnit({ unit, name, example }: { unit: TimeOptions; name: string; example: string }) {
  const styles = useStyles2(getPromDurationStyles);

  return (
    <>
      <div className={styles.unit}>{unit}</div>
      <div>{name}</div>
      <code>{example}</code>
    </>
  );
}

const getPromDurationStyles = (theme: GrafanaTheme2) => ({
  unit: css`
    font-weight: ${theme.typography.fontWeightBold};
  `,
  list: css`
    display: grid;
    grid-template-columns: max-content 1fr 2fr;
    gap: ${theme.spacing(1, 3)};
  `,
  header: css`
    display: contents;
    font-weight: ${theme.typography.fontWeightBold};
  `,
  examples: css`
    display: contents;
    & > div {
      grid-column: 1 / span 2;
    }
  `,
});
