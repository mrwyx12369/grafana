import React from 'react';

import { ConfigSubSection } from '@grafana/experimental';
import { config } from '@grafana/runtime';
import { Badge, LegacyForms } from '@grafana/ui';
import { ConfigDescriptionLink } from 'app/core/components/ConfigDescriptionLink';

const { FormField } = LegacyForms;

type Props = {
  maxLines: string;
  onMaxLinedChange: (value: string) => void;
  predefinedOperations: string;
  onPredefinedOperationsChange: (value: string) => void;
};

export const QuerySettings = (props: Props) => {
  const { maxLines, onMaxLinedChange, predefinedOperations, onPredefinedOperationsChange } = props;
  return (
    <ConfigSubSection
      title="Queries"
      description={
        <ConfigDescriptionLink
          description="用于自定义查询体验的其他选项。 "
          suffix="loki/#configure-the-data-source"
          feature="query settings"
        />
      }
    >
      <div className="gf-form-inline">
        <div className="gf-form">
          <FormField
            label="Maximum lines"
            labelWidth={11}
            inputWidth={20}
            inputEl={
              <input
                type="number"
                className="gf-form-input width-8 gf-form-input--has-help-icon"
                value={maxLines}
                onChange={(event) => onMaxLinedChange(event.currentTarget.value)}
                spellCheck={false}
                placeholder="1000"
              />
            }
            tooltip={
              <>
              Loki 查询必须包含返回的最大行数限制（默认值：1000）。增加这个限制为具有更大的结果集以进行即席分析。如果您的浏览器成为显示日志结果时缓慢。
              </>
            }
          />
        </div>
      </div>
      {config.featureToggles.lokiPredefinedOperations && (
        <div className="gf-form-inline">
          <div className="gf-form">
            <FormField
              label="预定义操作"
              labelWidth={11}
              inputEl={
                <input
                  type="string"
                  className="gf-form-input width-20 gf-form-input--has-help-icon"
                  value={predefinedOperations}
                  onChange={(event) => onPredefinedOperationsChange(event.currentTarget.value)}
                  spellCheck={false}
                  placeholder="| unpack | line_format"
                />
              }
              tooltip={
                <div>
                  {
                    'Predefined operations are used as an initial state for your queries. They are useful, if you want to unpack, parse or format all log lines. Currently we support only log operations starting with |. For example: | unpack | line_format "{{.message}}".'
                  }
                </div>
              }
            />
            <Badge
              text="Experimental"
              color="orange"
              icon="exclamation-triangle"
              tooltip="Predefined operations is an experimental feature that may change in the future."
            />
          </div>
        </div>
      )}
    </ConfigSubSection>
  );
};
