import { css } from '@emotion/css';
import { debounce } from 'lodash';
import React, { useCallback, useEffect, useRef } from 'react';

import { SelectableValue } from '@grafana/data';
import { Stack } from '@grafana/experimental';
import { Button, Field, Icon, Input, Label as LabelElement, Select, Tooltip, useStyles2 } from '@grafana/ui';
import { ObjectMatcher, Receiver, Route, RouteWithID } from 'app/plugins/datasource/alertmanager/types';

import { useURLSearchParams } from '../../hooks/useURLSearchParams';
import { matcherToObjectMatcher, parseMatchers } from '../../utils/alertmanager';
import { getInheritedProperties } from '../../utils/notification-policies';

interface NotificationPoliciesFilterProps {
  receivers: Receiver[];
  onChangeMatchers: (labels: ObjectMatcher[]) => void;
  onChangeReceiver: (receiver: string | undefined) => void;
}

const NotificationPoliciesFilter = ({
  receivers,
  onChangeReceiver,
  onChangeMatchers,
}: NotificationPoliciesFilterProps) => {
  const [searchParams, setSearchParams] = useURLSearchParams();
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const { queryString, contactPoint } = getNotificationPoliciesFilters(searchParams);
  const styles = useStyles2(getStyles);

  const handleChangeLabels = useCallback(() => debounce(onChangeMatchers, 500), [onChangeMatchers]);

  useEffect(() => {
    onChangeReceiver(contactPoint);
  }, [contactPoint, onChangeReceiver]);

  useEffect(() => {
    const matchers = parseMatchers(queryString ?? '').map(matcherToObjectMatcher);
    handleChangeLabels()(matchers);
  }, [handleChangeLabels, queryString]);

  const clearFilters = useCallback(() => {
    if (searchInputRef.current) {
      searchInputRef.current.value = '';
    }
    setSearchParams({ contactPoint: undefined, queryString: undefined });
  }, [setSearchParams]);

  const receiverOptions: Array<SelectableValue<string>> = receivers.map(toOption);
  const selectedContactPoint = receiverOptions.find((option) => option.value === contactPoint) ?? null;

  const hasFilters = queryString || contactPoint;
  const inputInvalid = queryString && queryString.length > 3 ? parseMatchers(queryString).length === 0 : false;

  return (
    <Stack direction="row" alignItems="flex-start" gap={0.5}>
      <Field
        className={styles.noBottom}
        label={
          <LabelElement>
            <Stack gap={0.5}>
              <span>按匹配器搜索</span>
              <Tooltip
                content={
                  <div>
                    使用逗号分隔的匹配器列表按匹配器过滤静音，如：
                    <pre>{`severity=critical, instance=~cluster-us-.+`}</pre>
                  </div>
                }
              >
                <Icon name="info-circle" size="sm" />
              </Tooltip>
            </Stack>
          </LabelElement>
        }
        invalid={inputInvalid}
        error={inputInvalid ? '查询必须使用有效的匹配器语法' : null}
      >
        <Input
          ref={searchInputRef}
          data-testid="search-query-input"
          placeholder="搜索"
          width={46}
          prefix={<Icon name="search" />}
          onChange={(event) => {
            setSearchParams({ queryString: event.currentTarget.value });
          }}
          defaultValue={queryString}
        />
      </Field>
      <Field label="按联系点搜索" style={{ marginBottom: 0 }}>
        <Select
          id="receiver"
          aria-label="Search by contact point"
          value={selectedContactPoint}
          options={receiverOptions}
          onChange={(option) => {
            setSearchParams({ contactPoint: option?.value });
          }}
          width={28}
          isClearable
        />
      </Field>
      {hasFilters && (
        <Button variant="secondary" icon="times" onClick={clearFilters} style={{ marginTop: 19 }}>
          清除过滤器
        </Button>
      )}
    </Stack>
  );
};

/**
 * Find a list of route IDs that match given input filters
 */
type FilterPredicate = (route: RouteWithID) => boolean;

export function findRoutesMatchingPredicate(routeTree: RouteWithID, predicateFn: FilterPredicate): RouteWithID[] {
  const matches: RouteWithID[] = [];

  function findMatch(route: RouteWithID) {
    if (predicateFn(route)) {
      matches.push(route);
    }

    route.routes?.forEach(findMatch);
  }

  findMatch(routeTree);
  return matches;
}

/**
 * This function will compute the full tree with inherited properties – this is mostly used for search and filtering
 */
export function computeInheritedTree<T extends Route>(parent: T): T {
  return {
    ...parent,
    routes: parent.routes?.map((child) => {
      const inheritedProperties = getInheritedProperties(parent, child);

      return computeInheritedTree({
        ...child,
        ...inheritedProperties,
      });
    }),
  };
}

const toOption = (receiver: Receiver) => ({
  label: receiver.name,
  value: receiver.name,
});

const getNotificationPoliciesFilters = (searchParams: URLSearchParams) => ({
  queryString: searchParams.get('queryString') ?? undefined,
  contactPoint: searchParams.get('contactPoint') ?? undefined,
});

const getStyles = () => ({
  noBottom: css`
    margin-bottom: 0;
  `,
});

export { NotificationPoliciesFilter };
