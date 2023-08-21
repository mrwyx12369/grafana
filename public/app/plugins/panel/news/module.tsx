import { PanelPlugin } from '@grafana/data';

import { NewsPanel } from './NewsPanel';
import { DEFAULT_FEED_URL } from './constants';
import { Options, defaultOptions } from './panelcfg.gen';

export const plugin = new PanelPlugin<Options>(NewsPanel).setPanelOptions((builder) => {
  builder
    .addTextInput({
      path: 'feedUrl',
      name: 'URL地址',
      description: '支持RSS和Atom提要',
      settings: {
        placeholder: DEFAULT_FEED_URL,
      },
      defaultValue: defaultOptions.feedUrl,
    })
    .addBooleanSwitch({
      path: 'showImage',
      name: '显示图片',
      description: '控制新闻项社交图片是否显示在文本内容上方',
      defaultValue: defaultOptions.showImage,
    });
});
