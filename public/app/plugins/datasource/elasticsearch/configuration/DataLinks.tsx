import { css } from '@emotion/css';
import React from 'react';

import { GrafanaTheme2, VariableOrigin, DataLinkBuiltInVars } from '@grafana/data';
import { ConfigSubSection } from '@grafana/experimental';
import { Button, useStyles2 } from '@grafana/ui';
import { ConfigDescriptionLink } from 'app/core/components/ConfigDescriptionLink';

import { DataLinkConfig } from '../types';

import { DataLink } from './DataLink';

const getStyles = (theme: GrafanaTheme2) => {
  return {
    addButton: css`
      margin-right: 10px;
    `,
    container: css`
      margin-bottom: ${theme.spacing(2)};
    `,
    dataLink: css`
      margin-bottom: ${theme.spacing(1)};
    `,
  };
};

export type Props = {
  value?: DataLinkConfig[];
  onChange: (value: DataLinkConfig[]) => void;
};
export const DataLinks = (props: Props) => {
  const { value, onChange } = props;
  const styles = useStyles2(getStyles);

  return (
    <ConfigSubSection
      title="数据连接"
      description={
        <ConfigDescriptionLink
          description="添加指向现有字段的链接。链接将显示在字段值旁边的日志行详细信息中。"
          suffix="elasticsearch/#data-links"
          feature="Elasticsearch data links"
        />
      }
    >
      <div className={styles.container}>
        {value && value.length > 0 && (
          <div className="gf-form-group">
            {value.map((field, index) => {
              return (
                <DataLink
                  className={styles.dataLink}
                  key={index}
                  value={field}
                  onChange={(newField) => {
                    const newDataLinks = [...value];
                    newDataLinks.splice(index, 1, newField);
                    onChange(newDataLinks);
                  }}
                  onDelete={() => {
                    const newDataLinks = [...value];
                    newDataLinks.splice(index, 1);
                    onChange(newDataLinks);
                  }}
                  suggestions={[
                    {
                      value: DataLinkBuiltInVars.valueRaw,
                      label: '原始值',
                      documentation: '字段的原始值',
                      origin: VariableOrigin.Value,
                    },
                  ]}
                />
              );
            })}
          </div>
        )}

        <Button
          type="button"
          variant={'secondary'}
          className={styles.addButton}
          icon="plus"
          onClick={(event) => {
            event.preventDefault();
            const newDataLinks = [...(value || []), { field: '', url: '' }];
            onChange(newDataLinks);
          }}
        >
          Add
        </Button>
      </div>
    </ConfigSubSection>
  );
};
