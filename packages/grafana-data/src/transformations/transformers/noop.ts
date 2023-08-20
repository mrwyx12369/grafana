import { DataFrame } from '../../types';
import { SynchronousDataTransformerInfo } from '../../types/transformations';

import { DataTransformerID } from './ids';

export interface NoopTransformerOptions {}

export const noopTransformer: SynchronousDataTransformerInfo<NoopTransformerOptions> = {
  id: DataTransformerID.noop,
  name: 'noop',
  description: '无操作转换器',
  defaultOptions: {},

  /** no operation */
  operator: (options: NoopTransformerOptions) => (source) => source,

  /** no operation */
  transformer: (options: NoopTransformerOptions) => (data: DataFrame[]) => data,
};
