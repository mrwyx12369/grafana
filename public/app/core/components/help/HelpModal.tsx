import { css } from '@emotion/css';
import React, { useMemo } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { Modal, useStyles2 } from '@grafana/ui';
import { getModKey } from 'app/core/utils/browser';

const getShortcuts = (modKey: string) => {
  return {
    Global: [
      { keys: ['g', 'h'], description: '转到主页仪表板' },
      { keys: ['g', 'd'], description: '转到仪表板' },
      { keys: ['g', 'e'], description: '前往探索' },
      { keys: ['g', 'p'], description: '转到个人资' },
      { keys: [`${modKey} + k`], description: '打开搜索' },
      { keys: ['esc'], description: '退出编辑/设置视图' },
      { keys: ['h'], description: '显示所有键盘快捷键' },
      { keys: ['c', 't'], description: '更改主题' },
    ],
    Dashboard: [
      { keys: [`${modKey}+s`], description: '保存仪表板' },
      { keys: ['d', 'r'], description: '刷新所有面板' },
      { keys: ['d', 's'], description: '仪表板设置' },
      { keys: ['d', 'v'], description: '切换活动/查看模式' },
      { keys: ['d', 'k'], description: '切换展台模式（隐藏顶部导航）' },
      { keys: ['d', 'E'], description: '展开所有行' },
      { keys: ['d', 'C'], description: '折叠所有行' },
      { keys: ['d', 'a'], description: '切换自动调整面板（实验性功能）' },
      { keys: [`${modKey} + o`], description: '切换共享图形十字准线' },
      { keys: ['d', 'l'], description: '切换所有面板图例' },
      { keys: ['d', 'x'], description: '切换所有面板中的示例' },
    ],
    'Focused Panel': [
      { keys: ['e'], description: '切换面板编辑视图' },
      { keys: ['v'], description: '切换面板全屏视图' },
      { keys: ['p', 's'], description: '开放式面板共享模式' },
      { keys: ['p', 'd'], description: '复制面板' },
      { keys: ['p', 'r'], description: '删除面板' },
      { keys: ['p', 'l'], description: '切换面板图例' },
    ],
    'Time Range': [
      { keys: ['t', 'z'], description: '缩小时间范围' },
      {
        keys: ['t', '←'],
        description: '将时间范围后移',
      },
      {
        keys: ['t', '→'],
        description: '将时间范围向前移动',
      },
      {
        keys: ['t', 'a'],
        description: '将时间范围设为绝对/永久',
      },
    ],
  };
};

export interface HelpModalProps {
  onDismiss: () => void;
}

export const HelpModal = ({ onDismiss }: HelpModalProps): JSX.Element => {
  const styles = useStyles2(getStyles);
  const modKey = useMemo(() => getModKey(), []);
  const shortcuts = useMemo(() => getShortcuts(modKey), [modKey]);
  return (
    <Modal title="Shortcuts" isOpen onDismiss={onDismiss} onClickBackdrop={onDismiss}>
      <div className={styles.categories}>
        {Object.entries(shortcuts).map(([category, shortcuts], i) => (
          <div className={styles.shortcutCategory} key={i}>
            <table className={styles.shortcutTable}>
              <tbody>
                <tr>
                  <th className={styles.shortcutTableCategoryHeader} colSpan={2}>
                    {category}
                  </th>
                </tr>
                {shortcuts.map((shortcut, j) => (
                  <tr key={`${i}-${j}`}>
                    <td className={styles.shortcutTableKeys}>
                      {shortcut.keys.map((key, k) => (
                        <span className={styles.shortcutTableKey} key={`${i}-${j}-${k}`}>
                          {key}
                        </span>
                      ))}
                    </td>
                    <td className={styles.shortcutTableDescription}>{shortcut.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </Modal>
  );
};

function getStyles(theme: GrafanaTheme2) {
  return {
    titleDescription: css`
      font-size: ${theme.typography.bodySmall.fontSize};
      font-weight: ${theme.typography.bodySmall.fontWeight};
      color: ${theme.colors.text.disabled};
      padding-bottom: ${theme.spacing(2)};
    `,
    categories: css`
      font-size: ${theme.typography.bodySmall.fontSize};
      display: flex;
      flex-flow: row wrap;
      justify-content: space-between;
      align-items: flex-start;
    `,
    shortcutCategory: css`
      width: 50%;
      font-size: ${theme.typography.bodySmall.fontSize};
    `,
    shortcutTable: css`
      margin-bottom: ${theme.spacing(2)};
    `,
    shortcutTableCategoryHeader: css`
      font-weight: normal;
      font-size: ${theme.typography.h6.fontSize};
      text-align: left;
    `,
    shortcutTableDescription: css`
      text-align: left;
      color: ${theme.colors.text.disabled};
      width: 99%;
      padding: ${theme.spacing(1, 2)};
    `,
    shortcutTableKeys: css`
      white-space: nowrap;
      width: 1%;
      text-align: right;
      color: ${theme.colors.text.primary};
    `,
    shortcutTableKey: css`
      display: inline-block;
      text-align: center;
      margin-right: ${theme.spacing(0.5)};
      padding: 3px 5px;
      font:
        11px Consolas,
        'Liberation Mono',
        Menlo,
        Courier,
        monospace;
      line-height: 10px;
      vertical-align: middle;
      border: solid 1px ${theme.colors.border.medium};
      border-radius: ${theme.shape.borderRadius(3)};
      color: ${theme.colors.text.primary};
      background-color: ${theme.colors.background.secondary};
    `,
  };
}
