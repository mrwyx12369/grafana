import React, { useState } from 'react';
import { useAsync } from 'react-use';

import { getBackendSrv } from '@grafana/runtime';
import { Button, Field, Form, Input } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';
import { getConfig } from 'app/core/config';
import { contextSrv } from 'app/core/core';
import { GrafanaRouteComponentProps } from 'app/core/navigation/types';

import { w3cStandardEmailValidator } from '../admin/utils';

interface FormModel {
  email: string;
  name?: string;
  username: string;
  password?: string;
}

const navModel = {
  main: {
    icon: 'grafana' as const,
    text: 'Invite',
    subTitle: 'Register your Grafana account',
    breadcrumbs: [{ title: 'Login', url: 'login' }],
  },
  node: {
    text: '',
  },
};

export interface Props extends GrafanaRouteComponentProps<{ code: string }> {}

export const SignupInvitedPage = ({ match }: Props) => {
  const code = match.params.code;
  const [initFormModel, setInitFormModel] = useState<FormModel>();
  const [greeting, setGreeting] = useState<string>();
  const [invitedBy, setInvitedBy] = useState<string>();

  useAsync(async () => {
    const invite = await getBackendSrv().get(`/api/user/invite/${code}`);

    setInitFormModel({
      email: invite.email,
      name: invite.name,
      username: invite.email,
    });

    setGreeting(invite.name || invite.email || invite.username);
    setInvitedBy(invite.invitedBy);
  }, [code]);

  const onSubmit = async (formData: FormModel) => {
    await getBackendSrv().post('/api/user/invite/complete', { ...formData, inviteCode: code });
    window.location.href = getConfig().appSubUrl + '/';
  };

  if (!initFormModel) {
    return null;
  }

  return (
    <Page navModel={navModel}>
      <Page.Contents>
        <h3 className="page-sub-heading">您好 {greeting || '现在'}.</h3>

        <div className="modal-tagline p-b-2">
          <em>{invitedBy || '有人'}</em> 已邀请您加入系统用户组织{' '}
          <span className="highlight-word">{contextSrv.user.orgName}</span>
          <br />
          请填写以下内容并选择密码以接受邀请并继续：
        </div>
        <Form defaultValues={initFormModel} onSubmit={onSubmit}>
          {({ register, errors }) => (
            <>
              <Field invalid={!!errors.email} error={errors.email && errors.email.message} label="电子邮件">
                <Input
                  placeholder="email@example.com"
                  {...register('email', {
                    required: '电子邮件为必填项',
                    pattern: {
                      value: w3cStandardEmailValidator,
                      message: '电子邮件无效',
                    },
                  })}
                />
              </Field>
              <Field invalid={!!errors.name} error={errors.name && errors.name.message} label="姓名">
                <Input placeholder="姓名(可选)" {...register('name')} />
              </Field>
              <Field invalid={!!errors.username} error={errors.username && errors.username.message} label="用户名">
                <Input {...register('username', { required: '用户名为必填项' })} placeholder="用户名" />
              </Field>
              <Field invalid={!!errors.password} error={errors.password && errors.password.message} label="密码">
                <Input
                  {...register('password', { required: '密码为必填项' })}
                  type="password"
                  placeholder="密码"
                />
              </Field>

              <Button type="submit">注册</Button>
            </>
          )}
        </Form>
      </Page.Contents>
    </Page>
  );
};

export default SignupInvitedPage;
