import React, { useRef, useEffect } from 'react';

import { Button, Icon, Modal } from '@grafana/ui';

type ConfirmModalProps = {
  isOpen: boolean;
  onCancel?: () => void;
  onDiscard?: () => void;
  onCopy?: () => void;
};
export function ConfirmModal({ isOpen, onCancel, onDiscard, onCopy }: ConfirmModalProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Moved from grafana/ui
  useEffect(() => {
    // for some reason autoFocus property did no work on this button, but this does
    if (isOpen) {
      buttonRef.current?.focus();
    }
  }, [isOpen]);

  return (
    <Modal
      title={
        <div className="modal-header-title">
          <Icon name="exclamation-triangle" size="lg" />
          <span className="p-l-1">Warning</span>
        </div>
      }
      onDismiss={onCancel}
      isOpen={isOpen}
    >
      <p>
      生成器模式不显示代码中所做的更改。查询生成器将显示您上次所做的更改构建器模式。
      </p>
      <p>是否要将代码复制到剪贴板？</p>
      <Modal.ButtonRow>
        <Button type="button" variant="secondary" onClick={onCancel} fill="outline">
          取消
        </Button>
        <Button variant="destructive" type="button" onClick={onDiscard} ref={buttonRef}>
          丢弃代码并切换
        </Button>
        <Button variant="primary" onClick={onCopy}>
          复制代码并切换
        </Button>
      </Modal.ButtonRow>
    </Modal>
  );
}
