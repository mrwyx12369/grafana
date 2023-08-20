import { css } from '@emotion/css';
import React, { useState } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { Alert, LinkButton, useStyles2 } from '@grafana/ui';

import { ROUTES } from '../../constants';

const getStyles = (theme: GrafanaTheme2) => ({
  alertContent: css`
    display: flex;
    flex-direction: row;
    padding: 0;
    justify-content: space-between;
    align-items: center;
  `,
  alertParagraph: css`
    margin: 0 ${theme.spacing(1)} 0 0;
    line-height: ${theme.spacing(theme.components.height.sm)};
  `,
});

export function ConnectionsRedirectNotice() {
  const styles = useStyles2(getStyles);
  const [showNotice, setShowNotice] = useState(true);

  return showNotice ? (
    <Alert severity="info" title="" onRemove={() => setShowNotice(false)}>
      <div className={styles.alertContent}>
        <p className={styles.alertParagraph}>
          数据源有了新家！您可以在“连接”页面中发现新数据源或管理现有数据源，该页面可从主菜单访问。
        </p>
        <LinkButton aria-label="Link to Connections" icon="arrow-right" href={ROUTES.DataSources} fill="text">
          转到连接
        </LinkButton>
      </div>
    </Alert>
  ) : (
    <></>
  );
}
