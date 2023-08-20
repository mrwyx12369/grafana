import { action } from '@storybook/addon-actions';
import { Meta } from '@storybook/react';
import React from 'react';

import { ToolbarButton, VerticalGroup } from '@grafana/ui';

import { StoryExample } from '../../utils/storybook/StoryExample';
import { withCenteredStory } from '../../utils/storybook/withCenteredStory';
import { IconButton } from '../IconButton/IconButton';

import { PageToolbar } from './PageToolbar';

const meta: Meta<typeof PageToolbar> = {
  title: 'Layout/PageToolbar',
  component: PageToolbar,
  decorators: [withCenteredStory],
  parameters: {},
};

export const Examples = () => {
  return (
    <VerticalGroup>
      <StoryExample name="标题不可点击">
        <PageToolbar pageIcon="bell" title="仪表板">
          <ToolbarButton icon="panel-add" />
          <ToolbarButton icon="sync">同步</ToolbarButton>
        </PageToolbar>
      </StoryExample>
      <StoryExample name="带有可点击的标题和父级">
        <PageToolbar
          pageIcon="apps"
          title="很长的仪表板名称"
          parent="长文件夹名称"
          titleHref=""
          parentHref=""
          leftItems={[
            <IconButton name="share-alt" size="lg" key="share" tooltip="共享" />,
            <IconButton name="favorite" iconType="mono" size="lg" key="favorite" tooltip="添加到收藏夹" />,
          ]}
        >
          <ToolbarButton icon="panel-add" />
          <ToolbarButton icon="share-alt" />
          <ToolbarButton icon="sync">同步</ToolbarButton>
          <ToolbarButton icon="cog">设置 </ToolbarButton>
        </PageToolbar>
      </StoryExample>
      <StoryExample name="Go back version">
        <PageToolbar title="服务概述/编辑面板" onGoBack={() => action('Go back')}>
          <ToolbarButton icon="cog" />
          <ToolbarButton icon="save" />
          <ToolbarButton>弃用</ToolbarButton>
          <ToolbarButton>应用</ToolbarButton>
        </PageToolbar>
      </StoryExample>
    </VerticalGroup>
  );
};

export default meta;
