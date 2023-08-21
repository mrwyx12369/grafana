import React, { useState } from 'react';

import { NavModelItem } from '@grafana/data';
import { locationService } from '@grafana/runtime';
import { Page } from 'app/core/components/Page/Page';
import { t } from 'app/core/internationalization';

import { PlaylistForm } from './PlaylistForm';
import { createPlaylist, getDefaultPlaylist } from './api';
import { Playlist } from './types';

export const PlaylistNewPage = () => {
  const [playlist] = useState<Playlist>(getDefaultPlaylist());

  const onSubmit = async (playlist: Playlist) => {
    await createPlaylist(playlist);
    locationService.push('/playlists');
  };

  const pageNav: NavModelItem = {
    text: t('nav.new-playlist', '新播放列表'),
    subTitle:t('nav.new-playlist-subtitle', '播放列表在预先选择的仪表板列表中轮换。播放列表可以是建立态势感知的好方法，或者只是向您的团队或访问者展示您的指标。')
  };

  return (
    <Page navId="dashboards/playlists" pageNav={pageNav}>
      <Page.Contents>
        <PlaylistForm onSubmit={onSubmit} playlist={playlist} />
      </Page.Contents>
    </Page>
  );
};

export default PlaylistNewPage;
