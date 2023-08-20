import React, { PropsWithChildren, useMemo } from 'react';

import { SelectableValue } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';

import { VariableSelectField } from '../editor/VariableSelectField';
import { VariableSort } from '../types';

interface Props {
  onChange: (option: SelectableValue<VariableSort>) => void;
  sort: VariableSort;
}

const SORT_OPTIONS = [
  { label: '禁用', value: VariableSort.disabled },
  { label: '按字母顺序(升序)', value: VariableSort.alphabeticalAsc },
  { label: '按字母顺序(降序)', value: VariableSort.alphabeticalDesc },
  { label: '数值(升序)', value: VariableSort.numericalAsc },
  { label: '数值(降序)', value: VariableSort.numericalDesc },
  { label: '按字母顺序((大小写敏感, 升序)', value: VariableSort.alphabeticalCaseInsensitiveAsc },
  { label: '按字母顺序(大小写敏感, 降序)', value: VariableSort.alphabeticalCaseInsensitiveDesc },
];

export function QueryVariableSortSelect({ onChange, sort }: PropsWithChildren<Props>) {
  const value = useMemo(() => SORT_OPTIONS.find((o) => o.value === sort) ?? SORT_OPTIONS[0], [sort]);

  return (
    <VariableSelectField
      name="Sort"
      description="如何对此变量的值进行排序"
      value={value}
      options={SORT_OPTIONS}
      onChange={onChange}
      testId={selectors.pages.Dashboard.Settings.Variables.Edit.QueryVariable.queryOptionsSortSelectV2}
      width={25}
    />
  );
}
