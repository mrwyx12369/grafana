import { css } from '@emotion/css';
import { compact, fill } from 'lodash';
import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { GrafanaTheme2, SupportedTransformationType } from '@grafana/data';
import { Stack } from '@grafana/experimental';
import {
  Button,
  Field,
  FieldArray,
  Icon,
  IconButton,
  Input,
  InputControl,
  Label,
  Select,
  Tooltip,
  useStyles2,
} from '@grafana/ui';

type Props = { readOnly: boolean };

const getStyles = (theme: GrafanaTheme2) => ({
  heading: css`
    font-size: ${theme.typography.h5.fontSize};
    font-weight: ${theme.typography.fontWeightRegular};
  `,
  // set fixed position from the top instead of centring as the container
  // may get bigger when the for is invalid
  removeButton: css`
    margin-top: 25px;
  `,
});

export const TransformationsEditor = (props: Props) => {
  const { control, formState, register, setValue, watch, getValues } = useFormContext();
  const { readOnly } = props;
  const [keptVals, setKeptVals] = useState<Array<{ expression?: string; mapValue?: string }>>([]);

  const styles = useStyles2(getStyles);

  const transformOptions = getTransformOptions();
  return (
    <>
      <input type="hidden" {...register('id')} />
      <FieldArray name="config.transformations" control={control}>
        {({ fields, append, remove }) => (
          <>
            <Stack direction="column" alignItems="flex-start">
              <div className={styles.heading}>转换</div>
              {fields.length === 0 && <div> 未定义转换。</div>}
              {fields.length > 0 && (
                <div>
                  {fields.map((fieldVal, index) => {
                    return (
                      <Stack direction="row" key={fieldVal.id} alignItems="top">
                        <Field
                          label={
                            <Stack gap={0.5}>
                              <Label htmlFor={`config.transformations.${fieldVal.id}-${index}.type`}>类型</Label>
                              <Tooltip
                                content={
                                  <div>
                                    <p>将应用于源数据的转换类型.</p>
                                  </div>
                                }
                              >
                                <Icon name="info-circle" size="sm" />
                              </Tooltip>
                            </Stack>
                          }
                          invalid={!!formState.errors?.config?.transformations?.[index]?.type}
                          error={formState.errors?.config?.transformations?.[index]?.type?.message}
                          validationMessageHorizontalOverflow={true}
                        >
                          <InputControl
                            render={({ field: { onChange, ref, ...field } }) => {
                              // input control field is not manipulated with remove, use value from control
                              return (
                                <Select
                                  {...field}
                                  value={fieldVal.type}
                                  onChange={(value) => {
                                    if (!readOnly) {
                                      const currentValues = getValues().config.transformations[index];
                                      let keptValsCopy = fill(Array(index + 1), {});
                                      keptVals.forEach((keptVal, i) => (keptValsCopy[i] = keptVal));
                                      keptValsCopy[index] = {
                                        expression: currentValues.expression,
                                        mapValue: currentValues.mapValue,
                                      };

                                      setKeptVals(keptValsCopy);

                                      const newValueDetails = getSupportedTransTypeDetails(value.value);

                                      if (newValueDetails.showExpression) {
                                        setValue(
                                          `config.transformations.${index}.expression`,
                                          keptVals[index]?.expression || ''
                                        );
                                      } else {
                                        setValue(`config.transformations.${index}.expression`, '');
                                      }

                                      if (newValueDetails.showMapValue) {
                                        setValue(
                                          `config.transformations.${index}.mapValue`,
                                          keptVals[index]?.mapValue || ''
                                        );
                                      } else {
                                        setValue(`config.transformations.${index}.mapValue`, '');
                                      }

                                      onChange(value.value);
                                    }
                                  }}
                                  options={transformOptions}
                                  width={25}
                                  inputId={`config.transformations.${fieldVal.id}-${index}.type`}
                                />
                              );
                            }}
                            control={control}
                            name={`config.transformations.${index}.type`}
                            rules={{ required: { value: true, message: 'Please select a transformation type' } }}
                          />
                        </Field>
                        <Field
                          label={
                            <Stack gap={0.5}>
                              <Label htmlFor={`config.transformations.${fieldVal.id}.field`}>字段</Label>
                              <Tooltip
                                content={
                                  <div>
                                    <p>
                                      可选。要转换的字段。如果未指定，则转换将应用于结果字段。
                                    </p>
                                  </div>
                                }
                              >
                                <Icon name="info-circle" size="sm" />
                              </Tooltip>
                            </Stack>
                          }
                        >
                          <Input
                            {...register(`config.transformations.${index}.field`)}
                            readOnly={readOnly}
                            defaultValue={fieldVal.field}
                            label="字段"
                            id={`config.transformations.${fieldVal.id}.field`}
                          />
                        </Field>
                        <Field
                          label={
                            <Stack gap={0.5}>
                              <Label htmlFor={`config.transformations.${fieldVal.id}.expression`}>
                                  表达式
                                {getSupportedTransTypeDetails(watch(`config.transformations.${index}.type`))
                                  .requireExpression
                                  ? ' *'
                                  : ''}
                              </Label>
                              <Tooltip
                                content={
                                  <div>
                                    <p>
                                      正则表达式必需。转换将使用的表达式。Logfmt 不使用进一步的规范。
                                    </p>
                                  </div>
                                }
                              >
                                <Icon name="info-circle" size="sm" />
                              </Tooltip>
                            </Stack>
                          }
                          invalid={!!formState.errors?.config?.transformations?.[index]?.expression}
                          error={formState.errors?.config?.transformations?.[index]?.expression?.message}
                        >
                          <Input
                            {...register(`config.transformations.${index}.expression`, {
                              required: getSupportedTransTypeDetails(watch(`config.transformations.${index}.type`))
                                .requireExpression
                                ? '请定义一个表达式'
                                : undefined,
                            })}
                            defaultValue={fieldVal.expression}
                            readOnly={readOnly}
                            disabled={
                              !getSupportedTransTypeDetails(watch(`config.transformations.${index}.type`))
                                .showExpression
                            }
                            id={`config.transformations.${fieldVal.id}.expression`}
                          />
                        </Field>
                        <Field
                          label={
                            <Stack gap={0.5}>
                              <Label htmlFor={`config.transformations.${fieldVal.id}.mapValue`}>Map value</Label>
                              <Tooltip
                                content={
                                  <div>
                                    <p>
                                     可选。定义变量的名称。这目前仅适用于具有单个未命名捕获组的正则表达式。
                                    </p>
                                  </div>
                                }
                              >
                                <Icon name="info-circle" size="sm" />
                              </Tooltip>
                            </Stack>
                          }
                        >
                          <Input
                            {...register(`config.transformations.${index}.mapValue`)}
                            defaultValue={fieldVal.mapValue}
                            readOnly={readOnly}
                            disabled={
                              !getSupportedTransTypeDetails(watch(`config.transformations.${index}.type`)).showMapValue
                            }
                            id={`config.transformations.${fieldVal.id}.mapValue`}
                          />
                        </Field>
                        {!readOnly && (
                          <div className={styles.removeButton}>
                            <IconButton
                              tooltip="删除转换"
                              name="trash-alt"
                              onClick={() => {
                                remove(index);
                                const keptValsCopy: Array<{ expression?: string; mapValue?: string } | undefined> = [
                                  ...keptVals,
                                ];
                                keptValsCopy[index] = undefined;
                                setKeptVals(compact(keptValsCopy));
                              }}
                            >
                              删除
                            </IconButton>
                          </div>
                        )}
                      </Stack>
                    );
                  })}
                </div>
              )}
              {!readOnly && (
                <Button
                  icon="plus"
                  onClick={() => append({ type: undefined }, { shouldFocus: false })}
                  variant="secondary"
                  type="button"
                >
                  新增转换
                </Button>
              )}
            </Stack>
          </>
        )}
      </FieldArray>
    </>
  );
};

interface SupportedTransformationTypeDetails {
  label: string;
  value: string;
  description?: string;
  showExpression: boolean;
  showMapValue: boolean;
  requireExpression?: boolean;
}

function getSupportedTransTypeDetails(transType: SupportedTransformationType): SupportedTransformationTypeDetails {
  switch (transType) {
    case SupportedTransformationType.Logfmt:
      return {
        label: 'Logfmt',
        value: SupportedTransformationType.Logfmt,
        description: 'Parse provided field with logfmt to get variables',
        showExpression: false,
        showMapValue: false,
      };
    case SupportedTransformationType.Regex:
      return {
        label: 'Regular expression',
        value: SupportedTransformationType.Regex,
        description:
          'Field will be parsed with regex. Use named capture groups to return multiple variables, or a single unnamed capture group to add variable to named map value.',
        showExpression: true,
        showMapValue: true,
        requireExpression: true,
      };
    default:
      return { label: transType, value: transType, showExpression: false, showMapValue: false };
  }
}

const getTransformOptions = () => {
  return Object.values(SupportedTransformationType).map((transformationType) => {
    const transType = getSupportedTransTypeDetails(transformationType);
    return {
      label: transType.label,
      value: transType.value,
      description: transType.description,
    };
  });
};
