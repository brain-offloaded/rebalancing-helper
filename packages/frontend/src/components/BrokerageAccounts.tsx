import { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import {
  useCreateBrokerageAccountMutation,
  useDeleteBrokerageAccountMutation,
  useGetBrokerageAccountsQuery,
  useGetBrokersQuery,
  useRefreshBrokerageHoldingsMutation,
  type GetBrokersQuery,
} from '../graphql/__generated__';
import { Button, ButtonGroup } from './ui/Button';
import { Card, CardHeader, CardTitle } from './ui/Card';
import {
  Form,
  Field,
  FieldLabel,
  HelperText,
  Select,
  TextInput,
} from './ui/FormControls';
import {
  Grid,
  Section,
  SectionDescription,
  SectionHeader,
  SectionTitle,
} from './ui/Layout';

const AccountInfo = styled.dl`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.sm};
  margin: 0;
`;

const AccountInfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const AccountInfoLabel = styled.dt`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.textLight};
`;

const AccountInfoValue = styled.dd`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const FormActions = styled(ButtonGroup)`
  justify-content: flex-end;
`;

const AccountActions = styled(ButtonGroup)`
  justify-content: flex-start;
`;

type Broker = GetBrokersQuery['brokers'][number];

type FormState = {
  name: string;
  brokerId: string;
  syncMode: 'API' | 'MANUAL';
  apiKey: string;
  apiSecret: string;
  description: string;
};

const createInitialFormState = (brokers: Broker[]): FormState => ({
  name: '',
  brokerId: brokers[0]?.id ?? '',
  syncMode: 'API',
  apiKey: '',
  apiSecret: '',
  description: '',
});

export const BrokerageAccounts: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formState, setFormState] = useState<FormState>(
    createInitialFormState([]),
  );

  const { data, loading, error, refetch } = useGetBrokerageAccountsQuery();
  const {
    data: brokersData,
    loading: brokersLoading,
    error: brokersError,
  } = useGetBrokersQuery();
  const [createAccount] = useCreateBrokerageAccountMutation();
  const [deleteAccount] = useDeleteBrokerageAccountMutation();
  const [refreshHoldings] = useRefreshBrokerageHoldingsMutation();

  const brokers = useMemo(() => brokersData?.brokers ?? [], [brokersData]);
  const accounts = useMemo(() => data?.brokerageAccounts ?? [], [data]);

  const brokerCount = brokers.length;
  const defaultBrokerId = brokers[0]?.id ?? '';

  useEffect(() => {
    if (brokerCount === 0) {
      setFormState((previous) => {
        if (!previous.brokerId) {
          return previous;
        }

        return { ...previous, brokerId: '' };
      });
      return;
    }

    setFormState((previous) => {
      if (previous.brokerId) {
        return previous;
      }

      if (!defaultBrokerId || previous.brokerId === defaultBrokerId) {
        return previous;
      }

      return { ...previous, brokerId: defaultBrokerId };
    });
  }, [brokerCount, defaultBrokerId]);

  const handleChange = useCallback(
    <Key extends keyof FormState>(key: Key, value: FormState[Key]) => {
      setFormState((previous) => ({ ...previous, [key]: value }));
    },
    [],
  );

  const resetForm = useCallback(() => {
    setFormState(createInitialFormState(brokers));
    setIsFormOpen(false);
  }, [brokers]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!formState.brokerId) {
        alert('증권사를 선택해주세요.');
        return;
      }
      if (formState.syncMode === 'API' && !formState.apiKey.trim()) {
        alert('API 키를 입력해주세요.');
        return;
      }

      const isApiMode = formState.syncMode === 'API';

      try {
        await createAccount({
          variables: {
            input: {
              name: formState.name,
              brokerId: formState.brokerId,
              syncMode: formState.syncMode,
              apiKey: isApiMode ? formState.apiKey : null,
              apiSecret:
                isApiMode && formState.apiSecret ? formState.apiSecret : null,
              description: formState.description ? formState.description : null,
              isActive: true,
            },
          },
        });
        resetForm();
        refetch();
      } catch (mutationError) {
        console.error('계정 생성 실패:', mutationError);
      }
    },
    [createAccount, formState, refetch, resetForm],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (!window.confirm('이 계정을 삭제하시겠습니까?')) {
        return;
      }
      try {
        await deleteAccount({ variables: { id } });
        refetch();
      } catch (mutationError) {
        console.error('계정 삭제 실패:', mutationError);
      }
    },
    [deleteAccount, refetch],
  );

  const handleRefresh = useCallback(
    async (accountId: string, syncMode: 'API' | 'MANUAL') => {
      if (syncMode !== 'API') {
        alert('수동 입력 계좌는 자동 새로고침을 지원하지 않습니다.');
        return;
      }
      try {
        await refreshHoldings({ variables: { accountId } });
        alert('보유 종목이 업데이트되었습니다.');
      } catch (mutationError) {
        console.error('보유 종목 새로고침 실패:', mutationError);
      }
    },
    [refreshHoldings],
  );

  if (loading || brokersLoading) {
    return <div>로딩 중...</div>;
  }

  if (error) {
    return <div>오류 발생: {error.message}</div>;
  }

  if (brokersError) {
    return <div>오류 발생: {brokersError.message}</div>;
  }

  return (
    <Section>
      <SectionHeader>
        <SectionTitle>증권사 계정 관리</SectionTitle>
        <SectionDescription>
          증권사 API를 통해 보유 종목을 연동합니다.
        </SectionDescription>
      </SectionHeader>

      <Button
        variant="primary"
        onClick={() => {
          setIsFormOpen((previous) => !previous);
        }}
      >
        {isFormOpen ? '취소' : '계정 추가'}
      </Button>

      {isFormOpen ? (
        <Card as="section">
          <CardHeader>
            <CardTitle>새 계정 추가</CardTitle>
          </CardHeader>
          <Form onSubmit={handleSubmit}>
            <Field>
              <FieldLabel htmlFor="account-name">계정 이름</FieldLabel>
              <TextInput
                id="account-name"
                value={formState.name}
                onChange={(event) => handleChange('name', event.target.value)}
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="account-broker">증권사</FieldLabel>
              <Select
                id="account-broker"
                value={formState.brokerId}
                onChange={(event) =>
                  handleChange('brokerId', event.target.value)
                }
                disabled={brokers.length === 0}
                required
              >
                {brokers.length === 0 ? (
                  <option value="">등록된 증권사가 없습니다</option>
                ) : (
                  brokers.map((broker) => (
                    <option key={broker.id} value={broker.id}>
                      {broker.name} ({broker.code})
                    </option>
                  ))
                )}
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="account-sync-mode">동기화 방식</FieldLabel>
              <Select
                id="account-sync-mode"
                value={formState.syncMode}
                onChange={(event) =>
                  handleChange(
                    'syncMode',
                    event.target.value as FormState['syncMode'],
                  )
                }
              >
                <option value="API">자동 동기화 (API)</option>
                <option value="MANUAL">수동 입력</option>
              </Select>
            </Field>

            {formState.syncMode === 'API' ? (
              <>
                <Field>
                  <FieldLabel htmlFor="account-api-key">API 키</FieldLabel>
                  <TextInput
                    id="account-api-key"
                    value={formState.apiKey}
                    onChange={(event) =>
                      handleChange('apiKey', event.target.value)
                    }
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="account-api-secret">
                    API 시크릿
                  </FieldLabel>
                  <TextInput
                    id="account-api-secret"
                    type="password"
                    value={formState.apiSecret}
                    onChange={(event) =>
                      handleChange('apiSecret', event.target.value)
                    }
                  />
                  <HelperText>
                    일부 증권사는 API 시크릿이 필요하지 않을 수 있습니다.
                  </HelperText>
                </Field>
              </>
            ) : null}

            <Field>
              <FieldLabel htmlFor="account-description">설명</FieldLabel>
              <TextInput
                id="account-description"
                value={formState.description}
                onChange={(event) =>
                  handleChange('description', event.target.value)
                }
              />
            </Field>

            <FormActions>
              <Button type="submit" variant="primary">
                계정 추가
              </Button>
              <Button type="button" onClick={resetForm}>
                취소
              </Button>
            </FormActions>
          </Form>
        </Card>
      ) : null}

      <Grid minWidth="320px">
        {accounts.map((account) => (
          <Card key={account.id} as="article">
            <CardHeader>
              <CardTitle>{account.name}</CardTitle>
            </CardHeader>
            <AccountInfo>
              <AccountInfoItem>
                <AccountInfoLabel>증권사</AccountInfoLabel>
                <AccountInfoValue>
                  {account.broker?.name ?? '알 수 없음'}
                  {account.broker?.code ? ` (${account.broker.code})` : ''}
                </AccountInfoValue>
              </AccountInfoItem>
              <AccountInfoItem>
                <AccountInfoLabel>동기화 방식</AccountInfoLabel>
                <AccountInfoValue>
                  {account.syncMode === 'API' ? '자동 동기화' : '수동 입력'}
                </AccountInfoValue>
              </AccountInfoItem>
              <AccountInfoItem>
                <AccountInfoLabel>상태</AccountInfoLabel>
                <AccountInfoValue>
                  {account.isActive ? '활성' : '비활성'}
                </AccountInfoValue>
              </AccountInfoItem>
              <AccountInfoItem>
                <AccountInfoLabel>생성일</AccountInfoLabel>
                <AccountInfoValue>
                  {new Date(account.createdAt).toLocaleDateString()}
                </AccountInfoValue>
              </AccountInfoItem>
              {account.description ? (
                <AccountInfoItem style={{ gridColumn: '1 / -1' }}>
                  <AccountInfoLabel>설명</AccountInfoLabel>
                  <AccountInfoValue>{account.description}</AccountInfoValue>
                </AccountInfoItem>
              ) : null}
            </AccountInfo>
            <AccountActions>
              <Button
                onClick={() => handleRefresh(account.id, account.syncMode)}
                disabled={account.syncMode !== 'API'}
                title={
                  account.syncMode === 'API'
                    ? undefined
                    : '수동 입력 계좌는 자동 새로고침을 지원하지 않습니다.'
                }
              >
                보유종목 새로고침
              </Button>
              <Button variant="danger" onClick={() => handleDelete(account.id)}>
                삭제
              </Button>
            </AccountActions>
          </Card>
        ))}
      </Grid>
    </Section>
  );
};
