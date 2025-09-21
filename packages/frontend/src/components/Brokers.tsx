import React, { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import styled from 'styled-components';
import {
  CREATE_BROKER,
  DELETE_BROKER,
  GET_BROKERS,
  UPDATE_BROKER,
} from '../graphql/brokerage';

const Container = styled.div`
  padding: ${(props) => props.theme.spacing.lg};
`;

const Section = styled.section`
  margin-bottom: ${(props) => props.theme.spacing.xl};
`;

const Card = styled.div`
  background: white;
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.md};
  padding: ${(props) => props.theme.spacing.lg};
  margin-bottom: ${(props) => props.theme.spacing.md};
  box-shadow: ${(props) => props.theme.shadows.sm};
`;

const Button = styled.button.attrs<{
  variant?: 'primary' | 'danger' | 'secondary';
  type?: 'button' | 'submit';
}>((props) => ({
  type: props.type ?? 'button',
}))<{ variant?: 'primary' | 'danger' | 'secondary' }>`
  padding: ${(props) => props.theme.spacing.sm}
    ${(props) => props.theme.spacing.md};
  font-size: ${(props) => props.theme.typography.fontSize.sm};
  font-weight: ${(props) => props.theme.typography.fontWeight.medium};
  border: none;
  border-radius: ${(props) => props.theme.borderRadius.sm};
  cursor: pointer;
  transition: all 0.2s ease;
  margin-right: ${(props) => props.theme.spacing.sm};

  ${(props) => {
    switch (props.variant) {
      case 'primary':
        return `
          background-color: ${props.theme.colors.primary};
          color: white;
          &:hover { background-color: #0056b3; }
        `;
      case 'danger':
        return `
          background-color: ${props.theme.colors.danger};
          color: white;
          &:hover { background-color: #c82333; }
        `;
      case 'secondary':
      default:
        return `
          background-color: ${props.theme.colors.light};
          color: ${props.theme.colors.text};
          border: 1px solid ${props.theme.colors.border};
          &:hover { background-color: #e2e6ea; }
        `;
    }
  }}
`;

const Form = styled.form`
  display: grid;
  gap: ${(props) => props.theme.spacing.md};
  margin-bottom: ${(props) => props.theme.spacing.lg};
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  font-weight: ${(props) => props.theme.typography.fontWeight.medium};
  margin-bottom: ${(props) => props.theme.spacing.xs};
`;

const Input = styled.input`
  padding: ${(props) => props.theme.spacing.sm}
    ${(props) => props.theme.spacing.md};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.sm};
  font-size: ${(props) => props.theme.typography.fontSize.md};

  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.colors.primary};
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }
`;

const BrokerGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: ${(props) => props.theme.spacing.md};
`;

const BrokerTitle = styled.h3`
  margin: 0;
  color: ${(props) => props.theme.colors.primary};
`;

const BrokerInfo = styled.div`
  margin-bottom: ${(props) => props.theme.spacing.md};
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: ${(props) => props.theme.spacing.xs};
`;

const InfoLabel = styled.span`
  font-weight: ${(props) => props.theme.typography.fontWeight.medium};
  color: ${(props) => props.theme.colors.textLight};
`;

type Broker = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  apiBaseUrl: string | null;
  isActive: boolean;
};

export const Brokers: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    apiBaseUrl: '',
  });

  const { data, loading, error, refetch } = useQuery(GET_BROKERS);
  const [createBroker] = useMutation(CREATE_BROKER);
  const [updateBroker] = useMutation(UPDATE_BROKER);
  const [deleteBroker] = useMutation(DELETE_BROKER);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createBroker({
        variables: {
          input: {
            code: formData.code,
            name: formData.name,
            description: formData.description || undefined,
            apiBaseUrl: formData.apiBaseUrl || undefined,
          },
        },
      });
      setFormData({ code: '', name: '', description: '', apiBaseUrl: '' });
      setIsFormOpen(false);
      refetch();
    } catch (mutationError) {
      console.error('증권사 생성 실패:', mutationError);
    }
  };

  const handleToggleActive = async (broker: Broker) => {
    try {
      await updateBroker({
        variables: {
          input: { id: broker.id, isActive: !broker.isActive },
        },
      });
      refetch();
    } catch (mutationError) {
      console.error('증권사 활성 상태 변경 실패:', mutationError);
    }
  };

  const handleDelete = async (broker: Broker) => {
    if (!window.confirm('이 증권사를 삭제하시겠습니까?')) {
      return;
    }
    try {
      await deleteBroker({ variables: { id: broker.id } });
      refetch();
    } catch (mutationError) {
      console.error('증권사 삭제 실패:', mutationError);
    }
  };

  if (loading) {
    return <div>로딩 중...</div>;
  }

  if (error) {
    return <div>오류 발생: {error.message}</div>;
  }

  const brokers: Broker[] = data?.brokers ?? [];

  return (
    <Container>
      <Section>
        <h2>증권사 관리</h2>
        <p>증권사 API 정보와 활성 상태를 관리합니다.</p>

        <Button
          variant="primary"
          type="button"
          onClick={() => setIsFormOpen((prev) => !prev)}
        >
          {isFormOpen ? '취소' : '증권사 추가'}
        </Button>

        {isFormOpen && (
          <Card>
            <h3>새 증권사 등록</h3>
            <Form onSubmit={handleCreate}>
              <FormGroup>
                <Label>증권사 코드</Label>
                <Input
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label>증권사 이름</Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label>설명</Label>
                <Input
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="증권사 설명"
                />
              </FormGroup>

              <FormGroup>
                <Label>API 베이스 URL</Label>
                <Input
                  value={formData.apiBaseUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, apiBaseUrl: e.target.value })
                  }
                  placeholder="https://api.broker.com"
                  type="url"
                />
              </FormGroup>

              <div>
                <Button type="submit" variant="primary">
                  등록
                </Button>
                <Button type="button" onClick={() => setIsFormOpen(false)}>
                  취소
                </Button>
              </div>
            </Form>
          </Card>
        )}

        <BrokerGrid>
          {brokers.map((broker) => (
            <Card key={broker.id}>
              <BrokerTitle>{broker.name}</BrokerTitle>

              <BrokerInfo>
                <InfoRow>
                  <InfoLabel>코드:</InfoLabel>
                  <span>{broker.code}</span>
                </InfoRow>
                <InfoRow>
                  <InfoLabel>상태:</InfoLabel>
                  <span>{broker.isActive ? '활성' : '비활성'}</span>
                </InfoRow>
                {broker.description && (
                  <InfoRow>
                    <InfoLabel>설명:</InfoLabel>
                    <span>{broker.description}</span>
                  </InfoRow>
                )}
                {broker.apiBaseUrl && (
                  <InfoRow>
                    <InfoLabel>API URL:</InfoLabel>
                    <span>{broker.apiBaseUrl}</span>
                  </InfoRow>
                )}
              </BrokerInfo>

              <div>
                <Button onClick={() => handleToggleActive(broker)}>
                  {broker.isActive ? '비활성화' : '활성화'}
                </Button>
                <Button variant="danger" onClick={() => handleDelete(broker)}>
                  삭제
                </Button>
              </div>
            </Card>
          ))}

          {brokers.length === 0 && <p>등록된 증권사가 없습니다.</p>}
        </BrokerGrid>
      </Section>
    </Container>
  );
};
