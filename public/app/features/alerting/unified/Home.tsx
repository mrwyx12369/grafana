import { css, cx } from '@emotion/css';
import React from 'react';
import SVG from 'react-inlinesvg';

import { GrafanaTheme2 } from '@grafana/data';
import { Stack } from '@grafana/experimental';
import { Icon, useStyles2, useTheme2 } from '@grafana/ui';

import { AlertingPageWrapper } from './components/AlertingPageWrapper';

export default function Home() {
  const theme = useTheme2();
  const styles = useStyles2(getWelcomePageStyles);

  return (
    <AlertingPageWrapper pageId={'alerting'}>
      <div className={styles.grid}>
        <WelcomeHeader className={styles.ctaContainer} />
        <ContentBox className={styles.flowBlock}>
          <div>
            <h3>工作原理</h3>
            <ul className={styles.list}>
              <li>
                系统警报会定期查询数据源并评估警报规则中定义的条件
              </li>
              <li>如果违反条件，则会触发警报实例</li>
              <li>触发实例根据匹配标签路由到通知策略</li>
              <li>通知将发送到通知策略中指定的联系点</li>
            </ul>
          </div>
          <SVG
            src={`public/img/alerting/at_a_glance_${theme.name.toLowerCase()}.svg`}
            width={undefined}
            height={undefined}
          />
        </ContentBox>
        <ContentBox className={styles.gettingStartedBlock}>
          <h3>开始使用</h3>
          <Stack direction="column" alignItems="space-between">
            <ul className={styles.list}>
              <li>
              通过添加来自多个数据源的查询和表达式来<strong>创建警报规则</strong>.
              </li>
              <li>
                <strong>添加标签</strong> 到警报规则{' '}
                <strong>并连接到通知策略</strong>
              </li>
              <li>
                <strong>配置联系点</strong>来定义将通知发送到的位置.
              </li>
              <li>
                <strong>配置通知策略</strong>将警报实例路由到联系点.
              </li>
            </ul>
            <div>
              <ArrowLink href="#" title="详细参考" />
            </div>
          </Stack>
        </ContentBox>
        <ContentBox className={styles.videoBlock}>
          <iframe
            title="Alerting - Introductory video"
            src="https://player.vimeo.com/video/720001629?h=c6c1732f92"
            width="960"
            height="540"
            allow="autoplay; fullscreen"
            allowFullScreen
            frameBorder="0"
            // This is necessary because color-scheme defined on :root has impact on iframe elements
            // More about how color-scheme works for iframes https://github.com/w3c/csswg-drafts/issues/4772
            // Summary: If the color scheme of an iframe differs from embedding document iframe gets an opaque canvas bg appropriate to its color scheme
            style={{ colorScheme: 'light dark' }}
          ></iframe>
        </ContentBox>
      </div>
    </AlertingPageWrapper>
  );
}

const getWelcomePageStyles = (theme: GrafanaTheme2) => ({
  grid: css`
    display: grid;
    grid-template-rows: min-content auto auto;
    grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
    gap: ${theme.spacing(2)};
  `,
  ctaContainer: css`
    grid-column: 1 / span 5;
  `,
  flowBlock: css`
    grid-column: 1 / span 5;

    display: flex;
    flex-wrap: wrap;
    gap: ${theme.spacing(1)};

    & > div {
      flex: 2;
      min-width: 350px;
    }
    & > svg {
      flex: 3;
      min-width: 500px;
    }
  `,
  videoBlock: css`
    grid-column: 3 / span 3;
    grid-row: 3 / span 1;

    // Video required
    position: relative;
    padding: 56.25% 0 0 0; /* 16:9 */

    iframe {
      position: absolute;
      top: ${theme.spacing(2)};
      left: ${theme.spacing(2)};
      width: calc(100% - ${theme.spacing(4)});
      height: calc(100% - ${theme.spacing(4)});
      border: none;
    }
  `,
  gettingStartedBlock: css`
    grid-column: 1 / span 2;
    justify-content: space-between;
  `,
  list: css`
    margin: ${theme.spacing(0, 2)};
    & > li {
      margin-bottom: ${theme.spacing(1)};
    }
  `,
});

function WelcomeHeader({ className }: { className?: string }) {
  const styles = useStyles2(getWelcomeHeaderStyles);

  return (
    <ContentBox className={cx(styles.ctaContainer, className)}>
      <WelcomeCTABox
        title="警报规则"
        description="定义触发警报规则之前必须满足的条件"
        href="/alerting/list"
        hrefText="管理警报规则"
      />
      <div className={styles.separator} />
      <WelcomeCTABox
        title="联系点"
        description="确定谁接收通知以及如何发送通知"
        href="/alerting/notifications"
        hrefText="管理联系点"
      />
      <div className={styles.separator} />
      <WelcomeCTABox
        title="通知策略"
        description="配置如何将触发警报实例路由到联系点"
        href="/alerting/routes"
        hrefText="管理通知策略"
      />
    </ContentBox>
  );
}

const getWelcomeHeaderStyles = (theme: GrafanaTheme2) => ({
  ctaContainer: css`
    padding: ${theme.spacing(4, 2)};
    display: flex;
    gap: ${theme.spacing(4)};
    justify-content: space-between;
    flex-wrap: wrap;

    ${theme.breakpoints.down('lg')} {
      flex-direction: column;
    }
  `,

  separator: css`
    width: 1px;
    background-color: ${theme.colors.border.medium};

    ${theme.breakpoints.down('lg')} {
      display: none;
    }
  `,
});

interface WelcomeCTABoxProps {
  title: string;
  description: string;
  href: string;
  hrefText: string;
}

function WelcomeCTABox({ title, description, href, hrefText }: WelcomeCTABoxProps) {
  const styles = useStyles2(getWelcomeCTAButtonStyles);

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>{title}</h3>
      <div className={styles.desc}>{description}</div>
      <div className={styles.actionRow}>
        <a href={href} className={styles.link}>
          {hrefText}
        </a>
      </div>
    </div>
  );
}

const getWelcomeCTAButtonStyles = (theme: GrafanaTheme2) => ({
  container: css`
    flex: 1;
    min-width: 240px;
    display: grid;
    gap: ${theme.spacing(1)};
    grid-template-columns: min-content 1fr 1fr 1fr;
    grid-template-rows: min-content auto min-content;
  `,

  title: css`
    margin-bottom: 0;
    grid-column: 2 / span 3;
    grid-row: 1;
  `,

  desc: css`
    grid-column: 2 / span 3;
    grid-row: 2;
  `,

  actionRow: css`
    grid-column: 2 / span 3;
    grid-row: 3;
    max-width: 240px;
  `,

  link: css`
    color: ${theme.colors.text.link};
  `,
});

function ContentBox({ children, className }: React.PropsWithChildren<{ className?: string }>) {
  const styles = useStyles2(getContentBoxStyles);

  return <div className={cx(styles.box, className)}>{children}</div>;
}

const getContentBoxStyles = (theme: GrafanaTheme2) => ({
  box: css`
    padding: ${theme.spacing(2)};
    background-color: ${theme.colors.background.secondary};
    border-radius: ${theme.shape.radius.default};
  `,
});

function ArrowLink({ href, title }: { href: string; title: string }) {
  const styles = useStyles2(getArrowLinkStyles);

  return (
    <a href={href} className={styles.link} rel="noreferrer">
      {title} <Icon name="angle-right" size="xl" />
    </a>
  );
}

const getArrowLinkStyles = (theme: GrafanaTheme2) => ({
  link: css`
    display: block;
    color: ${theme.colors.text.link};
  `,
});
