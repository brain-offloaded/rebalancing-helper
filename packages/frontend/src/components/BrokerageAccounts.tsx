import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import styled from 'styled-components';
import {
  GET_BROKERAGE_ACCOUNTS,
  CREATE_BROKERAGE_ACCOUNT,
  DELETE_BROKERAGE_ACCOUNT,
  REFRESH_BROKERAGE_HOLDINGS,
} from '../graphql/brokerage';

const Container = styled.div`
  padding: ${(props) => props.theme.spacing.lg};
`;

const Section = styled.div`
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

const Button = styled.button<{ variant?: 'primary' | 'danger' | 'secondary' }>`
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

const AccountGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: ${(props) => props.theme.spacing.md};
`;

const AccountCard = styled(Card)`
  position: relative;
`;

const AccountHeader = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: ${(props) => props.theme.spacing.md};
`;

const AccountTitle = styled.h3`
  margin: 0;
  color: ${(props) => props.theme.colors.primary};
`;

const AccountInfo = styled.div`
  margin-bottom: ${(props) => props.theme.spacing.md};
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: ${(props) => props.theme.spacing.xs};
`;

const Label2 = styled.span`
  font-weight: ${(props) => props.theme.typography.fontWeight.medium};
  color: ${(props) => props.theme.colors.textLight};
`;

interface BrokerageAccount {
  id: string;
  name: string;
  brokerName: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const BrokerageAccounts: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    brokerName: '',
    apiKey: '',
    apiSecret: '',
    apiBaseUrl: '',
    description: '',
  });

  const { data, loading, error, refetch } = useQuery(GET_BROKERAGE_ACCOUNTS);
  const [createAccount] = useMutation(CREATE_BROKERAGE_ACCOUNT);
  const [deleteAccount] = useMutation(DELETE_BROKERAGE_ACCOUNT);
  const [refreshHoldings] = useMutation(REFRESH_BROKERAGE_HOLDINGS);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAccount({
        variables: { input: formData },
      });
      setFormData({
        name: '',
        brokerName: '',
        apiKey: '',
        apiSecret: '',
        apiBaseUrl: '',
        description: '',
      });
      setShowForm(false);
      refetch();
    } catch (error) {
      console.error('계정 생성 실패:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('이 계정을 삭제하시겠습니까?')) {
      try {
        await deleteAccount({ variables: { id } });
        refetch();
      } catch (error) {
        console.error('계정 삭제 실패:', error);
      }
    }
  };

  const handleRefresh = async (accountId: string) => {
    try {
      await refreshHoldings({ variables: { accountId } });
      alert('보유 종목이 업데이트되었습니다.');
    } catch (error) {
      console.error('보유 종목 새로고침 실패:', error);
    }
  };

  if (loading) return <div>로딩 중...</div>;
  if (error) return <div>오류 발생: {error.message}</div>;

  return (
    <Container>
      <Section>
        <h2>증권사 계정 관리</h2>
        <p>증권사 API를 통해 보유 종목을 연동합니다.</p>

        <Button variant="primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '취소' : '계정 추가'}
        </Button>

        {showForm && (
          <Card>
            <h3>새 계정 추가</h3>
            <Form onSubmit={handleSubmit}>
              <FormGroup>
                <Label>계정 이름</Label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label>증권사 이름</Label>
                <Input
                  type="text"
                  value={formData.brokerName}
                  onChange={(e) =>
                    setFormData({ ...formData, brokerName: e.target.value })
                  }
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label>API 키</Label>
                <Input
                  type="text"
                  value={formData.apiKey}
                  onChange={(e) =>
                    setFormData({ ...formData, apiKey: e.target.value })
                  }
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label>API 시크릿</Label>
                <Input
                  type="password"
                  value={formData.apiSecret}
                  onChange={(e) =>
                    setFormData({ ...formData, apiSecret: e.target.value })
                  }
                />
              </FormGroup>

              <FormGroup>
                <Label>API 베이스 URL</Label>
                <Input
                  type="url"
                  value={formData.apiBaseUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, apiBaseUrl: e.target.value })
                  }
                  placeholder="https://api.broker.com"
                />
              </FormGroup>

              <FormGroup>
                <Label>설명</Label>
                <Input
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </FormGroup>

              <div>
                <Button type="submit" variant="primary">
                  계정 추가
                </Button>
                <Button type="button" onClick={() => setShowForm(false)}>
                  취소
                </Button>
              </div>
            </Form>
          </Card>
        )}

        <AccountGrid>
          {data?.brokerageAccounts?.map((account: BrokerageAccount) => (
            <AccountCard key={account.id}>
              <AccountHeader>
                <AccountTitle>{account.name}</AccountTitle>
              </AccountHeader>

              <AccountInfo>
                <InfoRow>
                  <Label2>증권사:</Label2>
                  <span>{account.brokerName}</span>
                </InfoRow>
                <InfoRow>
                  <Label2>상태:</Label2>
                  <span>{account.isActive ? '활성' : '비활성'}</span>
                </InfoRow>
                {account.description && (
                  <InfoRow>
                    <Label2>설명:</Label2>
                    <span>{account.description}</span>
                  </InfoRow>
                )}
                <InfoRow>
                  <Label2>생성일:</Label2>
                  <span>
                    {new Date(account.createdAt).toLocaleDateString()}
                  </span>
                </InfoRow>
              </AccountInfo>

              <div>
                <Button onClick={() => handleRefresh(account.id)}>
                  보유종목 새로고침
                </Button>
                <Button
                  variant="danger"
                  onClick={() => handleDelete(account.id)}
                >
                  삭제
                </Button>
              </div>
            </AccountCard>
          ))}
        </AccountGrid>
      </Section>
    </Container>
  );
};
