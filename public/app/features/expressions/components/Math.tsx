import { css } from '@emotion/css';
import React, { ChangeEvent } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { Stack } from '@grafana/experimental';
import { Icon, InlineField, InlineLabel, TextArea, Toggletip, useStyles2 } from '@grafana/ui';

import { ExpressionQuery } from '../types';

interface Props {
  labelWidth: number | 'auto';
  query: ExpressionQuery;
  onChange: (query: ExpressionQuery) => void;
  onRunQuery: () => void;
}

const mathPlaceholder =
  '对一个或多个查询的数学运算。你通过${refId}引用查询，即。$A、$B、$C等n' +
  '两个标量值的总和：$A + $B > 10';

export const Math = ({ labelWidth, onChange, query, onRunQuery }: Props) => {
  const onExpressionChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ ...query, expression: event.target.value });
  };

  const styles = useStyles2(getStyles);

  const executeQuery = () => {
    if (query.expression) {
      onRunQuery();
    }
  };

  return (
    <Stack direction="row">
      <InlineField
        label={
          <InlineLabel width="auto">
            <Toggletip
              fitContent
              content={
                <div className={styles.documentationContainer}>
                  <div>
                    对一个或多个查询运行数学运算。你引用查询 {'${refId}'} 即。$A、$B$C {'${refId}'} ie. $A, $B, $C
                    等.
                    <br />
                    例如: <code>$A + $B</code>
                  </div>
                  <header className={styles.documentationHeader}>可用的数学函数</header>
                  <div className={styles.documentationFunctions}>
                    <DocumentedFunction
                      name="abs"
                      description="返回其参数的绝对值，可以是数字或序列"
                    />
                    <DocumentedFunction
                      name="is_inf"
                      description="对于Inf值（负值或正值），返回 1，为其他值返回 0。它能够对系列或标量值进行操作。"
                    />
                    <DocumentedFunction
                      name="is_nan"
                      description="对于 NaN 值返回 1，对于其他值返回 0。它能够对系列或标量值进行操作。"
                    />
                    <DocumentedFunction
                      name="is_null"
                      description="对于 null 值返回 1，为其他值返回 0。它能够对系列或标量值进行操作。"
                    />
                    <DocumentedFunction
                      name="is_number"
                      description="对于所有实数值返回 1，对于非数字返回 0。它能够对系列或标量值进行操作。"
                    />
                    <DocumentedFunction
                      name="log"
                      description="返回其参数的自然对数，可以是数字或序列"
                    />
                    <DocumentedFunction
                      name="inf, infn, nan, and null"
                      description="inf 表示无穷大正数，infn 表示无穷大负数，nan 和 null 函数都返回与其名称匹配的单个标量值。"
                    />
                    <DocumentedFunction
                      name="round"
                      description="返回舍入整数值。它能够对系列或标量值进行操作。"
                    />
                    <DocumentedFunction
                      name="ceil"
                      description="将数字向上舍入为最接近的整数值。它能够对系列或标量值进行操作。"
                    />
                    <DocumentedFunction
                      name="floor"
                      description="将数字向下舍入到最接近的整数值。它能够对系列或标量值进行操作。"
                    />
                  </div>
                </div>
              }
              title={
                <Stack gap={1} direction="row">
                  <Icon name="book-open" /> 数学运算符
                </Stack>
              }
              footer={
                <div>
                  请参阅有关{' '}的其他文档
                  <a
                    className={styles.documentationLink}
                    target="_blank"
                    href="https://www.smxyi.com/docs/datav/latest/panels/query-a-data-source/use-expressions-to-manipulate-data/about-expressions/#math"
                    rel="noreferrer"
                  >
                    <Icon size="xs" name="external-link-alt" /> 数学表达式
                  </a>
                  .
                </div>
              }
              closeButton={true}
              placement="bottom-start"
            >
              <div className={styles.info}>
                表达式 <Icon name="info-circle" />
              </div>
            </Toggletip>
          </InlineLabel>
        }
        labelWidth={labelWidth}
        grow={true}
        shrink={true}
      >
        <TextArea
          value={query.expression}
          onChange={onExpressionChange}
          rows={1}
          placeholder={mathPlaceholder}
          onBlur={executeQuery}
          style={{ minWidth: 250, lineHeight: '26px', minHeight: 32 }}
        />
      </InlineField>
    </Stack>
  );
};

interface DocumentedFunctionProps {
  name: string;
  description: React.ReactNode;
}
const DocumentedFunction = ({ name, description }: DocumentedFunctionProps) => {
  const styles = useStyles2(getDocumentedFunctionStyles);

  return (
    <>
      <span className={styles.name}>{name}</span>
      <span className={styles.description}>{description}</span>
    </>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  documentationHeader: css`
    font-size: ${theme.typography.h5.fontSize};
    font-weight: ${theme.typography.h5.fontWeight};
  `,
  documentationLink: css`
    color: ${theme.colors.text.link};
  `,
  documentationContainer: css`
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: ${theme.spacing(2)};

    padding: ${theme.spacing(1)} ${theme.spacing(2)};
  `,
  documentationFunctions: css`
    display: grid;
    grid-template-columns: max-content auto;
    column-gap: ${theme.spacing(2)};
  `,
  info: css`
    display: flex;
    flex-direction: row;
    align-items: center;
    cursor: pointer;
    gap: ${theme.spacing(1)};
  `,
});

const getDocumentedFunctionStyles = (theme: GrafanaTheme2) => ({
  name: css`
    font-weight: ${theme.typography.fontWeightBold};
  `,
  description: css`
    font-size: ${theme.typography.bodySmall.fontSize};
    color: ${theme.colors.text.disabled};
  `,
});
