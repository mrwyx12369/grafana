import React, { useMemo } from 'react';

import { DataFrame, FieldMatcherID, fieldMatchers, FieldType, PanelProps, TimeRange } from '@grafana/data';
import { isLikelyAscendingVector } from '@grafana/data/src/transformations/transformers/joinDataFrames';
import { config, PanelDataErrorView } from '@grafana/runtime';
import {
  KeyboardPlugin,
  preparePlotFrame,
  TimeSeries,
  TooltipDisplayMode,
  TooltipPlugin,
  usePanelContext,
} from '@grafana/ui';
import { XYFieldMatchers } from '@grafana/ui/src/components/GraphNG/types';
import { findFieldIndex } from 'app/features/dimensions';

import { ContextMenuPlugin } from '../timeseries/plugins/ContextMenuPlugin';
import { prepareGraphableFields, regenerateLinksSupplier } from '../timeseries/utils';

import { Options } from './panelcfg.gen';

export const TrendPanel = ({
  data,
  timeRange,
  timeZone,
  width,
  height,
  options,
  fieldConfig,
  replaceVariables,
  id,
}: PanelProps<Options>) => {
  const { sync, dataLinkPostProcessor } = usePanelContext();
  // Need to fallback to first number field if no xField is set in options otherwise panel crashes 😬
  const trendXFieldName =
    options.xField ?? data.series[0].fields.find((field) => field.type === FieldType.number)?.name;

  const preparePlotFrameTimeless = (frames: DataFrame[], dimFields: XYFieldMatchers, timeRange?: TimeRange | null) => {
    dimFields = {
      ...dimFields,
      x: fieldMatchers.get(FieldMatcherID.byName).get(trendXFieldName),
    };

    return preparePlotFrame(frames, dimFields);
  };

  const info = useMemo(() => {
    if (data.series.length > 1) {
      return {
        warning: '仅支持一个帧，请考虑添加联接转换',
        frames: data.series,
      };
    }

    let frames = data.series;
    let xFieldIdx: number | undefined;
    if (options.xField) {
      xFieldIdx = findFieldIndex(frames[0], options.xField);
      if (xFieldIdx == null) {
        return {
          warning: '找不到字段：' + options.xField,
          frames: data.series,
        };
      }
    } else {
      // first number field
      // Perhaps we can/should support any ordinal rather than an error here
      xFieldIdx = frames[0].fields.findIndex((f) => f.type === FieldType.number);
      if (xFieldIdx === -1) {
        return {
          warning: '未找到X轴的数值字段',
          frames,
        };
      }
    }

    // Make sure values are ascending
    if (xFieldIdx != null) {
      const field = frames[0].fields[xFieldIdx];
      if (field.type === FieldType.number && !isLikelyAscendingVector(field.values)) {
        return {
          warning: `值必须按升序排列`,
          frames,
        };
      }
    }

    return { frames: prepareGraphableFields(frames, config.theme2, undefined, xFieldIdx) };
  }, [data.series, options.xField]);

  if (info.warning || !info.frames) {
    return (
      <PanelDataErrorView
        panelId={id}
        fieldConfig={fieldConfig}
        data={data}
        message={info.warning}
        needsNumberField={true}
      />
    );
  }

  return (
    <TimeSeries // Name change!
      frames={info.frames}
      structureRev={data.structureRev}
      timeRange={timeRange}
      timeZone={timeZone}
      width={width}
      height={height}
      legend={options.legend}
      options={options}
      preparePlotFrame={preparePlotFrameTimeless}
    >
      {(config, alignedDataFrame) => {
        if (alignedDataFrame.fields.some((f) => Boolean(f.config.links?.length))) {
          alignedDataFrame = regenerateLinksSupplier(
            alignedDataFrame,
            info.frames!,
            replaceVariables,
            timeZone,
            dataLinkPostProcessor
          );
        }

        return (
          <>
            <KeyboardPlugin config={config} />
            {options.tooltip.mode === TooltipDisplayMode.None || (
              <TooltipPlugin
                frames={info.frames!}
                data={alignedDataFrame}
                config={config}
                mode={options.tooltip.mode}
                sortOrder={options.tooltip.sort}
                sync={sync}
                timeZone={timeZone}
              />
            )}

            <ContextMenuPlugin
              data={alignedDataFrame}
              frames={info.frames!}
              config={config}
              timeZone={timeZone}
              replaceVariables={replaceVariables}
              defaultItems={[]}
            />
          </>
        );
      }}
    </TimeSeries>
  );
};
