import type { ReactNode } from 'react';
import styled from 'styled-components';
import { Button } from './Button';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background-color: rgba(15, 23, 42, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContainer = styled.div`
  background-color: #ffffff;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.xl};
  max-width: 720px;
  width: min(100%, 720px);
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: ${({ theme }) => theme.shadows.lg};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const ModalHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
`;

const ModalSubtitle = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textLight};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const ModalBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.sm};
`;

export interface ModalProps {
  open: boolean;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  onClose: () => void;
}

export const Modal: React.FC<ModalProps> = ({
  open,
  title,
  subtitle,
  children,
  actions,
  onClose,
}) => {
  if (!open) {
    return null;
  }

  return (
    <Overlay role="presentation" onClick={onClose}>
      <ModalContainer
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <ModalHeader>
          <ModalTitle>{title}</ModalTitle>
          {subtitle ? <ModalSubtitle>{subtitle}</ModalSubtitle> : null}
        </ModalHeader>
        <ModalBody>{children}</ModalBody>
        <ModalFooter>
          {actions}
          <Button variant="secondary" onClick={onClose}>
            닫기
          </Button>
        </ModalFooter>
      </ModalContainer>
    </Overlay>
  );
};
