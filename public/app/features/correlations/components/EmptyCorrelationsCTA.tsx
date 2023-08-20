import React from 'react';

import { Card } from '@grafana/ui';
import EmptyListCTA from 'app/core/components/EmptyListCTA/EmptyListCTA';

interface Props {
  onClick?: () => void;
  canWriteCorrelations: boolean;
}
export const EmptyCorrelationsCTA = ({ onClick, canWriteCorrelations }: Props) => {
  // TODO: if there are no datasources show a different message

  return canWriteCorrelations ? (
    <EmptyListCTA
      title="您尚未定义任何关联。"
      buttonIcon="gf-glue"
      onClick={onClick}
      buttonTitle="添加相关性"
      proTip="您还可以通过数据源预配定义关联"
    />
  ) : (
    <Card>
      <Card.Heading>尚未配置关联。</Card.Heading>
      <Card.Description>请与管理员联系以创建新的关联.</Card.Description>
    </Card>
  );
};
