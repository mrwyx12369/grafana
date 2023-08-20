import { LabelParamEditor } from '../../prometheus/querybuilder/components/LabelParamEditor';
import {
  createAggregationOperation,
  createAggregationOperationWithParam,
} from '../../prometheus/querybuilder/shared/operationUtils';
import { QueryBuilderOperationDef, QueryBuilderOperationParamValue } from '../../prometheus/querybuilder/shared/types';

import { binaryScalarOperations } from './binaryScalarOperations';
import { UnwrapParamEditor } from './components/UnwrapParamEditor';
import {
  addLokiOperation,
  addNestedQueryHandler,
  createRangeOperation,
  createRangeOperationWithGrouping,
  getLineFilterRenderer,
  labelFilterRenderer,
  pipelineRenderer,
} from './operationUtils';
import { LokiOperationId, LokiOperationOrder, lokiOperators, LokiVisualQueryOperationCategory } from './types';

export function getOperationDefinitions(): QueryBuilderOperationDef[] {
  const aggregations = [
    LokiOperationId.Sum,
    LokiOperationId.Min,
    LokiOperationId.Max,
    LokiOperationId.Avg,
    LokiOperationId.Stddev,
    LokiOperationId.Stdvar,
    LokiOperationId.Count,
  ].flatMap((opId) =>
    createAggregationOperation(opId, {
      addOperationHandler: addLokiOperation,
      orderRank: LokiOperationOrder.Last,
    })
  );

  const aggregationsWithParam = [LokiOperationId.TopK, LokiOperationId.BottomK].flatMap((opId) => {
    return createAggregationOperationWithParam(
      opId,
      {
        params: [{ name: 'K-value', type: 'number' }],
        defaultParams: [5],
      },
      {
        addOperationHandler: addLokiOperation,
        orderRank: LokiOperationOrder.Last,
      }
    );
  });

  const rangeOperations = [
    createRangeOperation(LokiOperationId.Rate),
    createRangeOperation(LokiOperationId.RateCounter),
    createRangeOperation(LokiOperationId.CountOverTime),
    createRangeOperation(LokiOperationId.SumOverTime),
    createRangeOperation(LokiOperationId.BytesRate),
    createRangeOperation(LokiOperationId.BytesOverTime),
    createRangeOperation(LokiOperationId.AbsentOverTime),
  ];

  const rangeOperationsWithGrouping = [
    ...createRangeOperationWithGrouping(LokiOperationId.AvgOverTime),
    ...createRangeOperationWithGrouping(LokiOperationId.MaxOverTime),
    ...createRangeOperationWithGrouping(LokiOperationId.MinOverTime),
    ...createRangeOperationWithGrouping(LokiOperationId.FirstOverTime),
    ...createRangeOperationWithGrouping(LokiOperationId.LastOverTime),
    ...createRangeOperationWithGrouping(LokiOperationId.StdvarOverTime),
    ...createRangeOperationWithGrouping(LokiOperationId.StddevOverTime),
    ...createRangeOperationWithGrouping(LokiOperationId.QuantileOverTime),
  ];

  const list: QueryBuilderOperationDef[] = [
    ...aggregations,
    ...aggregationsWithParam,
    ...rangeOperations,
    ...rangeOperationsWithGrouping,
    {
      id: LokiOperationId.Json,
      name: 'Json',
      params: [
        {
          name: 'Expression',
          type: 'string',
          restParam: true,
          optional: true,
          minWidth: 18,
          placeholder: 'server="servers[0]"',
          description:'将表达式与 json 解析器结合使用将仅将指定的 json 字段提取到标签。您可以通过这种方式指定一个或多个表达式。所有表达式都必须用引号引起来。',
        },
      ],
      defaultParams: [],
      alternativesKey: 'format',
      category: LokiVisualQueryOperationCategory.Formats,
      orderRank: LokiOperationOrder.Parsers,
      renderer: (model, def, innerExpr) => `${innerExpr} | json ${model.params.join(', ')}`.trim(),
      addOperationHandler: addLokiOperation,
      explainHandler: () =>
        `这将从 [json]（https://grafana.com/docs/loki/latest/logql/log_queries/#json） 格式的日志行中提取键和值作为标签。 提取的标签可用于标签筛选器表达式，并通过解包操作用作范围聚合的值。`,
    },
    {
      id: LokiOperationId.Logfmt,
      name: 'Logfmt',
      params: [],
      defaultParams: [],
      alternativesKey: 'format',
      category: LokiVisualQueryOperationCategory.Formats,
      orderRank: LokiOperationOrder.Parsers,
      renderer: pipelineRenderer,
      addOperationHandler: addLokiOperation,
      explainHandler: () =>
        `这将从 [logfmt]（https://grafana.com/docs/loki/latest/logql/log_queries/#logfmt） 格式的日志行中提取所有键和值作为标签。提取的标签可用于标签筛选器表达式，并通过解包操作用作范围聚合的值。`,
    },
    {
      id: LokiOperationId.Regexp,
      name: 'Regexp',
      params: [
        {
          name: 'String',
          type: 'string',
          hideName: true,
          placeholder: '<re>',
          description: '与日志行的结构匹配的正则表达式。',
          minWidth: 20,
        },
      ],
      defaultParams: [''],
      alternativesKey: 'format',
      category: LokiVisualQueryOperationCategory.Formats,
      orderRank: LokiOperationOrder.Parsers,
      renderer: (model, def, innerExpr) => `${innerExpr} | regexp \`${model.params[0]}\``,
      addOperationHandler: addLokiOperation,
      explainHandler: () =>
        `[正则表达式解析器]（https://grafana.com/docs/loki/latest/logql/log_queries/#regular-表达式）采用单个参数 |正则表达式 “<re>” 是使用 Golang RE2 语法的正则表达式。正则表达式必须至少包含一个命名的子匹配项（例如 （？P<name>re）），每个子匹配将提取不同的标签。表达式与日志行的结构匹配。 提取的标签可用于标签筛选器表达式，并通过解包操作用作范围聚合的值。`,
    },
    {
      id: LokiOperationId.Pattern,
      name: 'Pattern',
      params: [
        {
          name: 'String',
          type: 'string',
          hideName: true,
          placeholder: '<pattern-expression>',
          description: '与日志行的结构匹配的表达式。',
          minWidth: 20,
        },
      ],
      defaultParams: [''],
      alternativesKey: 'format',
      category: LokiVisualQueryOperationCategory.Formats,
      orderRank: LokiOperationOrder.Parsers,
      renderer: (model, def, innerExpr) => `${innerExpr} | pattern \`${model.params[0]}\``,
      addOperationHandler: addLokiOperation,
      explainHandler: () =>
        `[模式解析器]（https://grafana.com/docs/loki/latest/logql/log_queries/#pattern） 允许通过定义模式表达式 （| 模式 ''） 从日志行中显式提取字段<pattern-expression>。表达式与日志行的结构匹配。提取的标签可用于标签筛选器表达式，并通过解包操作用作范围聚合的值。`,
    },
    {
      id: LokiOperationId.Unpack,
      name: 'Unpack',
      params: [],
      defaultParams: [],
      alternativesKey: 'format',
      category: LokiVisualQueryOperationCategory.Formats,
      orderRank: LokiOperationOrder.Parsers,
      renderer: pipelineRenderer,
      addOperationHandler: addLokiOperation,
      explainHandler: () =>
        `这将从 JSON 日志行中提取所有键和值，[解包]（https://grafana.com/docs/loki/latest/logql/log_queries/#unpack） 打包阶段的所有嵌入式标签。提取的标签可用于标签筛选器表达式，并通过解包操作用作范围聚合的值。`,
    },
    {
      id: LokiOperationId.LineFormat,
      name: 'Line format',
      params: [
        {
          name: 'String',
          type: 'string',
          hideName: true,
          placeholder: '{{.status_code}}',
          description: '可引用流标签和提取标签的行模板。',
          minWidth: 20,
        },
      ],
      defaultParams: [''],
      alternativesKey: 'format',
      category: LokiVisualQueryOperationCategory.Formats,
      orderRank: LokiOperationOrder.PipeOperations,
      renderer: (model, def, innerExpr) => `${innerExpr} | line_format \`${model.params[0]}\``,
      addOperationHandler: addLokiOperation,
      explainHandler: () =>
        `这将替换使用指定模板的日志行。模板可以引用流标签和提取的标签。示例：'{{.status_code}} - {{.message}}'[阅读文档]（https://grafana.com/docs/loki/latest/logql/log_queries/#line-format-expression） 了解更多信息。`,
    },
    {
      id: LokiOperationId.LabelFormat,
      name: '标签格式',
      params: [
        { name: '标签', type: 'string' },
        { name: '重命名', type: 'string' },
      ],
      defaultParams: ['', ''],
      alternativesKey: 'format',
      category: LokiVisualQueryOperationCategory.Formats,
      orderRank: LokiOperationOrder.PipeOperations,
      renderer: (model, def, innerExpr) => `${innerExpr} | label_format ${model.params[1]}=${model.params[0]}`,
      addOperationHandler: addLokiOperation,
      explainHandler: () =>
        `这会将标签名称更改为所需的新标签。在下面的示例中，标签“error_level”将重命名为“级别”。

        示例：''error_level='级别' ''
        
        [阅读文档]（https://grafana.com/docs/loki/latest/logql/log_queries/#labels-format-expression）了解更多信息。
                `,
    },

    {
      id: LokiOperationId.LineContains,
      name: 'Line contains',
      params: [
        {
          name: 'String',
          type: 'string',
          hideName: true,
          placeholder: '要查找的文本',
          description: '查找包含此文本的日志行',
          minWidth: 20,
          runQueryOnEnter: true,
        },
      ],
      defaultParams: [''],
      alternativesKey: 'line filter',
      category: LokiVisualQueryOperationCategory.LineFilters,
      orderRank: LokiOperationOrder.LineFilters,
      renderer: getLineFilterRenderer('|='),
      addOperationHandler: addLokiOperation,
      explainHandler: (op) => `返回包含字符串的日志行 \`${op.params[0]}\`.`,
    },
    {
      id: LokiOperationId.LineContainsNot,
      name: 'Line does not contain',
      params: [
        {
          name: 'String',
          type: 'string',
          hideName: true,
          placeholder: '要排除的文本',
          description: '查找不包含此文本的日志行',
          minWidth: 26,
          runQueryOnEnter: true,
        },
      ],
      defaultParams: [''],
      alternativesKey: 'line filter',
      category: LokiVisualQueryOperationCategory.LineFilters,
      orderRank: LokiOperationOrder.LineFilters,
      renderer: getLineFilterRenderer('!='),
      addOperationHandler: addLokiOperation,
      explainHandler: (op) => `返回不包含字符串的日志行 \`${op.params[0]}\`.`,
    },
    {
      id: LokiOperationId.LineContainsCaseInsensitive,
      name: 'Line contains case insensitive',
      params: [
        {
          name: 'String',
          type: 'string',
          hideName: true,
          placeholder: '要查找的文本',
          description: '查找包含此文本的日志行',
          minWidth: 33,
          runQueryOnEnter: true,
        },
      ],
      defaultParams: [''],
      alternativesKey: 'line filter',
      category: LokiVisualQueryOperationCategory.LineFilters,
      orderRank: LokiOperationOrder.LineFilters,
      renderer: getLineFilterRenderer('|~', true),
      addOperationHandler: addLokiOperation,
      explainHandler: (op) => `返回与正则表达式匹配的日志行 \`(?i)${op.params[0]}\`.`,
    },
    {
      id: LokiOperationId.LineContainsNotCaseInsensitive,
      name: '行不包含不区分大小写的内容',
      params: [
        {
          name: 'String',
          type: 'string',
          hideName: true,
          placeholder: '要排除的文本',
          description: '查找不包含此文本的日志行',
          minWidth: 40,
          runQueryOnEnter: true,
        },
      ],
      defaultParams: [''],
      alternativesKey: 'line filter',
      category: LokiVisualQueryOperationCategory.LineFilters,
      orderRank: LokiOperationOrder.LineFilters,
      renderer: getLineFilterRenderer('!~', true),
      addOperationHandler: addLokiOperation,
      explainHandler: (op) => `返回与正则表达式不匹配的日志行 \`(?i)${op.params[0]}\`.`,
    },
    {
      id: LokiOperationId.LineMatchesRegex,
      name: 'Line contains regex match',
      params: [
        {
          name: 'Regex',
          type: 'string',
          hideName: true,
          placeholder: '要匹配的模式',
          description: '查找与此正则表达式模式匹配的日志行',
          minWidth: 30,
          runQueryOnEnter: true,
        },
      ],
      defaultParams: [''],
      alternativesKey: 'line filter',
      category: LokiVisualQueryOperationCategory.LineFilters,
      orderRank: LokiOperationOrder.LineFilters,
      renderer: getLineFilterRenderer('|~'),
      addOperationHandler: addLokiOperation,
      explainHandler: (op) => `返回与 'RE2' 正则表达式模式匹配的日志行。 \`${op.params[0]}\`.`,
    },
    {
      id: LokiOperationId.LineMatchesRegexNot,
      name: '行与正则表达式不匹配',
      params: [
        {
          name: 'Regex',
          type: 'string',
          hideName: true,
          placeholder: '要排除的模式',
          description: '查找与此正则表达式模式不匹配的日志行',
          minWidth: 30,
          runQueryOnEnter: true,
        },
      ],
      defaultParams: [''],
      alternativesKey: 'line filter',
      category: LokiVisualQueryOperationCategory.LineFilters,
      orderRank: LokiOperationOrder.LineFilters,
      renderer: getLineFilterRenderer('!~'),
      addOperationHandler: addLokiOperation,
      explainHandler: (op) => `返回与 'RE2' 正则表达式模式不匹配的日志行。 \`${op.params[0]}\`.`,
    },
    {
      id: LokiOperationId.LineFilterIpMatches,
      name: 'IP 线路过滤器表达式',
      params: [
        {
          name: 'Operator',
          type: 'string',
          minWidth: 16,
          options: [lokiOperators.contains, lokiOperators.doesNotContain],
        },
        {
          name: 'Pattern',
          type: 'string',
          placeholder: '<pattern>',
          minWidth: 16,
          runQueryOnEnter: true,
        },
      ],
      defaultParams: ['|=', ''],
      alternativesKey: 'line filter',
      category: LokiVisualQueryOperationCategory.LineFilters,
      orderRank: LokiOperationOrder.LineFilters,
      renderer: (op, def, innerExpr) => `${innerExpr} ${op.params[0]} ip(\`${op.params[1]}\`)`,
      addOperationHandler: addLokiOperation,
      explainHandler: (op) => `返回日志行，使用 IP 匹配 \`${op.params[1]}\``,
    },
    {
      id: LokiOperationId.LabelFilter,
      name: 'Label filter expression',
      params: [
        { name: 'Label', type: 'string', minWidth: 14 },
        {
          name: 'Operator',
          type: 'string',
          minWidth: 14,
          options: [
            lokiOperators.equals,
            lokiOperators.doesNotEqual,
            lokiOperators.matchesRegex,
            lokiOperators.doesNotMatchRegex,
            lokiOperators.greaterThan,
            lokiOperators.lessThan,
            lokiOperators.greaterThanOrEqual,
            lokiOperators.lessThanOrEqual,
          ],
        },
        { name: 'Value', type: 'string', minWidth: 14 },
      ],
      defaultParams: ['', '=', ''],
      alternativesKey: 'label filter',
      category: LokiVisualQueryOperationCategory.LabelFilters,
      orderRank: LokiOperationOrder.PipeOperations,
      renderer: labelFilterRenderer,
      addOperationHandler: addLokiOperation,
      explainHandler: () => `Label expression filter allows filtering using original and extracted labels.`,
    },
    {
      id: LokiOperationId.LabelFilterIpMatches,
      name: 'IP label filter expression',
      params: [
        { name: 'Label', type: 'string', minWidth: 14 },
        {
          name: 'Operator',
          type: 'string',
          minWidth: 14,
          options: [lokiOperators.equals, lokiOperators.doesNotEqual],
        },
        { name: 'Value', type: 'string', minWidth: 14 },
      ],
      defaultParams: ['', '=', ''],
      alternativesKey: 'label filter',
      category: LokiVisualQueryOperationCategory.LabelFilters,
      orderRank: LokiOperationOrder.PipeOperations,
      renderer: (model, def, innerExpr) =>
        `${innerExpr} | ${model.params[0]} ${model.params[1]} ip(\`${model.params[2]}\`)`,
      addOperationHandler: addLokiOperation,
      explainHandler: (op) => `Return log lines using IP matching of \`${op.params[2]}\` for \`${op.params[0]}\` label`,
    },
    {
      id: LokiOperationId.LabelFilterNoErrors,
      name: 'No pipeline errors',
      params: [],
      defaultParams: [],
      alternativesKey: 'label filter',
      category: LokiVisualQueryOperationCategory.LabelFilters,
      orderRank: LokiOperationOrder.NoErrors,
      renderer: (model, def, innerExpr) => `${innerExpr} | __error__=\`\``,
      addOperationHandler: addLokiOperation,
      explainHandler: () => `Filter out all formatting and parsing errors.`,
    },
    {
      id: LokiOperationId.Unwrap,
      name: 'Unwrap',
      params: [
        {
          name: 'Identifier',
          type: 'string',
          hideName: true,
          minWidth: 16,
          placeholder: 'Label key',
          editor: UnwrapParamEditor,
        },
        {
          name: 'Conversion function',
          hideName: true,
          type: 'string',
          options: ['duration', 'duration_seconds', 'bytes'],
          optional: true,
        },
      ],
      defaultParams: ['', ''],
      alternativesKey: 'format',
      category: LokiVisualQueryOperationCategory.Formats,
      orderRank: LokiOperationOrder.Unwrap,
      renderer: (op, def, innerExpr) =>
        `${innerExpr} | unwrap ${op.params[1] ? `${op.params[1]}(${op.params[0]})` : op.params[0]}`,
      addOperationHandler: addLokiOperation,
      explainHandler: (op) => {
        let label = String(op.params[0]).length > 0 ? op.params[0] : '<label>';
        return `Use the extracted label \`${label}\` as sample values instead of log lines for the subsequent range aggregation.${
          op.params[1]
            ? ` Conversion function \`${op.params[1]}\` wrapping \`${label}\` will attempt to convert this label from a specific format (e.g. 3k, 500ms).`
            : ''
        }`;
      },
    },
    {
      id: LokiOperationId.Decolorize,
      name: 'Decolorize',
      params: [],
      defaultParams: [],
      alternativesKey: 'format',
      category: LokiVisualQueryOperationCategory.Formats,
      orderRank: LokiOperationOrder.PipeOperations,
      renderer: (op, def, innerExpr) => `${innerExpr} | decolorize`,
      addOperationHandler: addLokiOperation,
      explainHandler: () => `This will remove ANSI color codes from log lines.`,
    },
    {
      id: LokiOperationId.Distinct,
      name: 'Distinct',
      params: [
        {
          name: 'Label',
          type: 'string',
          restParam: true,
          optional: true,
          editor: LabelParamEditor,
        },
      ],
      defaultParams: [''],
      alternativesKey: 'format',
      category: LokiVisualQueryOperationCategory.Formats,
      orderRank: LokiOperationOrder.Unwrap,
      renderer: (op, def, innerExpr) => `${innerExpr} | distinct ${op.params.join(',')}`,
      addOperationHandler: addLokiOperation,
      explainHandler: () =>
        'Allows filtering log lines using their original and extracted labels to filter out duplicate label values. The first line occurrence of a distinct value is returned, and the others are dropped.',
    },
    ...binaryScalarOperations,
    {
      id: LokiOperationId.NestedQuery,
      name: 'Binary operation with query',
      params: [],
      defaultParams: [],
      category: LokiVisualQueryOperationCategory.BinaryOps,
      renderer: (model, def, innerExpr) => innerExpr,
      addOperationHandler: addNestedQueryHandler,
    },
  ];

  return list;
}

// Keeping a local copy as an optimization measure.
const definitions = getOperationDefinitions();

/**
 * Given an operator, return the corresponding explain.
 * For usage within the Query Editor.
 */
export function explainOperator(id: LokiOperationId | string): string {
  const definition = definitions.find((operation) => operation.id === id);

  const explain = definition?.explainHandler?.({ id: '', params: ['<value>'] }) || '';

  // Strip markdown links
  return explain.replace(/\[(.*)\]\(.*\)/g, '$1');
}

export function getDefinitionById(id: string): QueryBuilderOperationDef | undefined {
  return definitions.find((x) => x.id === id);
}

export function checkParamsAreValid(def: QueryBuilderOperationDef, params: QueryBuilderOperationParamValue[]): boolean {
  // For now we only check if the operation has all the required params.
  if (params.length < def.params.filter((param) => !param.optional).length) {
    return false;
  }

  return true;
}
