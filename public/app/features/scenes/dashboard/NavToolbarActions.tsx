import React from 'react';

import { locationService } from '@grafana/runtime';
import { Button } from '@grafana/ui';
import { AppChromeUpdate } from 'app/core/components/AppChrome/AppChromeUpdate';
import { NavToolbarSeparator } from 'app/core/components/AppChrome/NavToolbar/NavToolbarSeparator';
import { DashNavButton } from 'app/features/dashboard/components/DashNav/DashNavButton';

import { DashboardScene } from './DashboardScene';

interface Props {
  dashboard: DashboardScene;
}

export const NavToolbarActions = React.memo<Props>(({ dashboard }) => {
  const { actions = [], isEditing, viewPanelKey, isDirty, uid } = dashboard.useState();
  const toolbarActions = (actions ?? []).map((action) => <action.Component key={action.state.key} model={action} />);

  if (uid) {
    toolbarActions.push(
      <DashNavButton
        key="button-scenes"
        tooltip={'作为仪表板查看'}
        icon="apps"
        onClick={() => locationService.push(`/d/${uid}`)}
      />
    );
  }

  toolbarActions.push(<NavToolbarSeparator leftActionsSeparator key="separator" />);

  if (viewPanelKey) {
    toolbarActions.push(
      <Button
        onClick={() => locationService.partial({ viewPanel: null })}
        tooltip=""
        key="back"
        variant="primary"
        fill="text"
      >
        Back to dashboard
      </Button>
    );

    return <AppChromeUpdate actions={toolbarActions} />;
  }

  if (!isEditing) {
    // TODO check permissions
    toolbarActions.push(
      <Button
        onClick={dashboard.onEnterEditMode}
        tooltip="进入编辑模式"
        key="edit"
        variant="primary"
        icon="pen"
        fill="text"
      >
        Edit
      </Button>
    );
  } else {
    // TODO check permissions
    toolbarActions.push(
      <Button onClick={dashboard.onEnterEditMode} tooltip="Save as copy" fill="text" key="save-as">
        另存为
      </Button>
    );
    toolbarActions.push(
      <Button onClick={dashboard.onDiscard} tooltip="保存更改" fill="text" key="discard" variant="destructive">
        丢弃
      </Button>
    );
    toolbarActions.push(
      <Button onClick={dashboard.onEnterEditMode} tooltip="保存更改" key="save" disabled={!isDirty}>
        保存
      </Button>
    );
  }

  return <AppChromeUpdate actions={toolbarActions} />;
});

NavToolbarActions.displayName = 'NavToolbarActions';
