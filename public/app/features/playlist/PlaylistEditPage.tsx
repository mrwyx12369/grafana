import React from 'react';
import { useAsync } from 'react-use';

import { NavModelItem } from '@grafana/data';
import { locationService } from '@grafana/runtime';
import { Page } from 'app/core/components/Page/Page';
import { GrafanaRouteComponentProps } from 'app/core/navigation/types';

import { PlaylistForm } from './PlaylistForm';
import { getPlaylist, updatePlaylist } from './api';
import { Playlist } from './types';

export interface RouteParams {
  uid: string;
}

interface Props extends GrafanaRouteComponentProps<RouteParams> {}

export const PlaylistEditPage = ({ match }: Props) => {
  const playlist = useAsync(() => getPlaylist(match.params.uid), [match.params]);

  const onSubmit = async (playlist: Playlist) => {
    await updatePlaylist(match.params.uid, playlist);
    locationService.push('/playlists');
  };

  const pageNav: NavModelItem = {
    text: '编辑播放列表',
    subTitle:
      '播放列表在预先选择的仪表板列表中轮换。播放列表可以是建立态势感知的好方法，或者只是向您的团队或访问者展示您的指标。',
  };

  return (
    <Page navId="dashboards/playlists" pageNav={pageNav}>
      <Page.Contents isLoading={playlist.loading}>
        {playlist.error && <div>加载播放列表时出错： {JSON.stringify(playlist.error)}</div>}

        {playlist.value && <PlaylistForm onSubmit={onSubmit} playlist={playlist.value} />}
      </Page.Contents>
    </Page>
  );
};

export default PlaylistEditPage;
