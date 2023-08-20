import React, { useCallback } from 'react';
import { useHistory } from 'react-router-dom';

import { NavModelItem } from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';
import { Form, Button, Input, Field } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

interface UserDTO {
  name: string;
  password: string;
  email?: string;
  login?: string;
}

const createUser = async (user: UserDTO) => getBackendSrv().post('/api/admin/users', user);

const pageNav: NavModelItem = {
  icon: 'user',
  id: 'user-new',
  text: '新用户',
  subTitle: '创建一个系统用户。',
};

const UserCreatePage = () => {
  const history = useHistory();

  const onSubmit = useCallback(
    async (data: UserDTO) => {
      const { id } = await createUser(data);

      history.push(`/admin/users/edit/${id}`);
    },
    [history]
  );

  return (
    <Page navId="global-users" pageNav={pageNav}>
      <Page.Contents>
        <Form onSubmit={onSubmit} validateOn="onBlur">
          {({ register, errors }) => {
            return (
              <>
                <Field
                  label="姓名"
                  required
                  invalid={!!errors.name}
                  error={errors.name ? '姓名为必填项' : undefined}
                >
                  <Input id="name-input" {...register('name', { required: true })} />
                </Field>

                <Field label="邮件">
                  <Input id="email-input" {...register('email')} />
                </Field>

                <Field label="账号">
                  <Input id="username-input" {...register('login')} />
                </Field>
                <Field
                  label="密码"
                  required
                  invalid={!!errors.password}
                  error={errors.password ? '密码为必填项，且必须至少包含 4 个字符' : undefined}
                >
                  <Input
                    id="password-input"
                    {...register('password', {
                      validate: (value) => value.trim() !== '' && value.length >= 4,
                    })}
                    type="password"
                  />
                </Field>
                <Button type="submit">创建</Button>
              </>
            );
          }}
        </Form>
      </Page.Contents>
    </Page>
  );
};

export default UserCreatePage;
