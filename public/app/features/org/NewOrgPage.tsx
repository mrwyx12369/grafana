import React from 'react';
import { connect, ConnectedProps } from 'react-redux';

import { NavModelItem } from '@grafana/data';
import { Button, Input, Field, Form, FieldSet } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';
import { getConfig } from 'app/core/config';

import { createOrganization } from './state/actions';

const mapDispatchToProps = {
  createOrganization,
};

const connector = connect(undefined, mapDispatchToProps);

type Props = ConnectedProps<typeof connector>;

interface CreateOrgFormDTO {
  name: string;
}

const pageNav: NavModelItem = {
  icon: 'building',
  id: 'org-new',
  text: '新建组织构名',
};

export const NewOrgPage = ({ createOrganization }: Props) => {
  const createOrg = async (newOrg: { name: string }) => {
    await createOrganization(newOrg);
    window.location.href = getConfig().appSubUrl + '/org';
  };

  return (
    <Page navId="global-orgs" pageNav={pageNav}>
      <Page.Contents>
        <p className="muted">
        每个组织都包含自己的仪表板、数据源和配置，无法共享在组织之间共享。虽然用户可能属于多个组织，但多个组织最常用于多租户部署.
        </p>

        <Form<CreateOrgFormDTO> onSubmit={createOrg}>
          {({ register, errors }) => {
            return (
              <>
                <FieldSet>
                  <Field label="组织机构名称" invalid={!!errors.name} error={errors.name && errors.name.message}>
                    <Input
                      placeholder="组织机构名称"
                      {...register('name', {
                        required: '组织名机构称为必填项',
                      })}
                    />
                  </Field>
                </FieldSet>
                <Button type="submit">创建</Button>
              </>
            );
          }}
        </Form>
      </Page.Contents>
    </Page>
  );
};

export default connector(NewOrgPage);
