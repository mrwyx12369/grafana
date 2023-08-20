import { css } from '@emotion/css';
import React, { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { GrafanaTheme2 } from '@grafana/data';
import { config } from '@grafana/runtime';
import {
  Button,
  ClipboardButton,
  DatePickerWithInput,
  Field,
  Input,
  Modal,
  RadioButtonGroup,
  useStyles2,
} from '@grafana/ui';

const EXPIRATION_OPTIONS = [
  { label: 'No expiration', value: false },
  { label: 'Set expiration date', value: true },
];

export type ServiceAccountToken = {
  name: string;
  secondsToLive?: number;
};

interface Props {
  isOpen: boolean;
  token: string;
  serviceAccountLogin: string;
  onCreateToken: (token: ServiceAccountToken) => void;
  onClose: () => void;
}

export const CreateTokenModal = ({ isOpen, token, serviceAccountLogin, onCreateToken, onClose }: Props) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const maxExpirationDate = new Date();
  if (config.tokenExpirationDayLimit !== undefined && config.tokenExpirationDayLimit > -1) {
    maxExpirationDate.setDate(maxExpirationDate.getDate() + config.tokenExpirationDayLimit + 1);
  } else {
    maxExpirationDate.setDate(8640000000000000);
  }
  const defaultExpirationDate = config.tokenExpirationDayLimit !== undefined && config.tokenExpirationDayLimit > 0;

  const [defaultTokenName, setDefaultTokenName] = useState('');
  const [newTokenName, setNewTokenName] = useState('');
  const [isWithExpirationDate, setIsWithExpirationDate] = useState(defaultExpirationDate);
  const [newTokenExpirationDate, setNewTokenExpirationDate] = useState<Date | string>(tomorrow);
  const [isExpirationDateValid, setIsExpirationDateValid] = useState(newTokenExpirationDate !== '');
  const styles = useStyles2(getStyles);

  useEffect(() => {
    // Generate new token name every time we open modal
    if (isOpen) {
      setDefaultTokenName(`${serviceAccountLogin}-${uuidv4()}`);
    }
  }, [serviceAccountLogin, isOpen]);

  const onExpirationDateChange = (value: Date | string) => {
    const isValid = value !== '';
    setIsExpirationDateValid(isValid);
    setNewTokenExpirationDate(value);
  };

  const onGenerateToken = () => {
    onCreateToken({
      name: newTokenName || defaultTokenName,
      secondsToLive: isWithExpirationDate ? getSecondsToLive(newTokenExpirationDate) : undefined,
    });
  };

  const onCloseInternal = () => {
    setNewTokenName('');
    setDefaultTokenName('');
    setIsWithExpirationDate(defaultExpirationDate);
    setNewTokenExpirationDate(tomorrow);
    setIsExpirationDateValid(newTokenExpirationDate !== '');
    onClose();
  };

  const modalTitle = !token ? '添加服务帐户令牌' : '已创建服务帐户令牌';

  return (
    <Modal
      isOpen={isOpen}
      title={modalTitle}
      onDismiss={onCloseInternal}
      className={styles.modal}
      contentClassName={styles.modalContent}
    >
      {!token ? (
        <div>
          <Field
            label="显示名称"
            description="用于轻松识别令牌的名称"
            // for now this is required
            // need to make this optional in backend as well
            required={true}
          >
            <Input
              name="tokenName"
              value={newTokenName}
              placeholder={defaultTokenName}
              onChange={(e) => {
                setNewTokenName(e.currentTarget.value);
              }}
            />
          </Field>
          <Field label="到期">
            <RadioButtonGroup
              options={EXPIRATION_OPTIONS}
              value={isWithExpirationDate}
              onChange={setIsWithExpirationDate}
              size="md"
            />
          </Field>
          {isWithExpirationDate && (
            <Field label="有效期">
              <DatePickerWithInput
                onChange={onExpirationDateChange}
                value={newTokenExpirationDate}
                placeholder=""
                minDate={tomorrow}
                maxDate={maxExpirationDate}
              />
            </Field>
          )}
          <Modal.ButtonRow>
            <Button onClick={onGenerateToken} disabled={isWithExpirationDate && !isExpirationDateValid}>
              生成令牌
            </Button>
          </Modal.ButtonRow>
        </div>
      ) : (
        <>
          <Field
            label="Token"
            description="立即复制令牌，因为您将无法再次看到它。丢失令牌需要创建一个新令牌。"
          >
            <div className={styles.modalTokenRow}>
              <Input name="tokenValue" value={token} readOnly />
              <ClipboardButton
                className={styles.modalCopyToClipboardButton}
                variant="primary"
                size="md"
                icon="copy"
                getText={() => token}
              >
                复制剪贴板
              </ClipboardButton>
            </div>
          </Field>
          <Modal.ButtonRow>
            <ClipboardButton variant="primary" getText={() => token} onClipboardCopy={onCloseInternal}>
              复制到剪贴板并关闭
            </ClipboardButton>
            <Button variant="secondary" onClick={onCloseInternal}>
              关闭
            </Button>
          </Modal.ButtonRow>
        </>
      )}
    </Modal>
  );
};

const getSecondsToLive = (date: Date | string) => {
  const dateAsDate = new Date(date);
  const now = new Date();

  return Math.ceil((dateAsDate.getTime() - now.getTime()) / 1000);
};

const getStyles = (theme: GrafanaTheme2) => {
  return {
    modal: css`
      width: 550px;
    `,
    modalContent: css`
      overflow: visible;
    `,
    modalTokenRow: css`
      display: flex;
    `,
    modalCopyToClipboardButton: css`
      margin-left: ${theme.spacing(0.5)};
    `,
  };
};
