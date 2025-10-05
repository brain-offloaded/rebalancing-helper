import { useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';
import {
  useCreateBrokerMutation,
  useDeleteBrokerMutation,
  useGetBrokersQuery,
  useUpdateBrokerMutation,
  type GetBrokersQuery,
} from '../graphql/__generated__';
import { Button, ButtonGroup } from './ui/Button';
import { Card, CardActions, CardHeader, CardTitle } from './ui/Card';
import { Form, Field, FieldLabel, TextInput } from './ui/FormControls';
import {
  Grid,
  Section,
  SectionDescription,
  SectionHeader,
  SectionTitle,
} from './ui/Layout';

const BrokerInfo = styled.dl`
  display: grid;
  gap: ${({ theme }) => theme.spacing.xs};
  margin: 0;
`;

const BrokerInfoItem = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const BrokerInfoLabel = styled.dt`
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.textLight};
`;

const BrokerInfoValue = styled.dd`
  margin: 0;
`;

const FormActions = styled(ButtonGroup)`
  justify-content: flex-end;
`;

type Broker = GetBrokersQuery['brokers'][number];

type BrokerFormState = {
  code: string;
  name: string;
  description: string;
  apiBaseUrl: string;
};

const INITIAL_FORM_STATE: BrokerFormState = {
  code: '',
  name: '',
  description: '',
  apiBaseUrl: '',
};

export const Brokers: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formState, setFormState] =
    useState<BrokerFormState>(INITIAL_FORM_STATE);

  const { data, loading, error, refetch } = useGetBrokersQuery();
  const [createBroker] = useCreateBrokerMutation();
  const [updateBroker] = useUpdateBrokerMutation();
  const [deleteBroker] = useDeleteBrokerMutation();

  const brokers = useMemo(() => data?.brokers ?? [], [data]);

  const handleChange = useCallback(
    <Key extends keyof BrokerFormState>(
      key: Key,
      value: BrokerFormState[Key],
    ) => {
      setFormState((previous) => ({ ...previous, [key]: value }));
    },
    [],
  );

  const resetForm = useCallback(() => {
    setFormState(INITIAL_FORM_STATE);
    setIsFormOpen(false);
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      try {
        await createBroker({
          variables: {
            input: {
              code: formState.code,
              name: formState.name,
              description: formState.description || null,
              apiBaseUrl: formState.apiBaseUrl || null,
            },
          },
        });
        resetForm();
        refetch();
      } catch (mutationError) {
        console.error('증권사 생성 실패:', mutationError);
      }
    },
    [createBroker, formState, refetch, resetForm],
  );

  const handleToggleActive = useCallback(
    async (broker: Broker) => {
      try {
        await updateBroker({
          variables: {
            input: {
              id: broker.id,
              isActive: !broker.isActive,
              code: null,
              name: null,
              description: null,
              apiBaseUrl: null,
            },
          },
        });
        refetch();
      } catch (mutationError) {
        console.error('증권사 활성 상태 변경 실패:', mutationError);
      }
    },
    [refetch, updateBroker],
  );

  const handleDelete = useCallback(
    async (broker: Broker) => {
      if (!window.confirm('이 증권사를 삭제하시겠습니까?')) {
        return;
      }
      try {
        await deleteBroker({ variables: { id: broker.id } });
        refetch();
      } catch (mutationError) {
        console.error('증권사 삭제 실패:', mutationError);
      }
    },
    [deleteBroker, refetch],
  );

  if (loading) {
    return <div>로딩 중...</div>;
  }

  if (error) {
    return <div>오류 발생: {error.message}</div>;
  }

  return (
    <Section>
      <SectionHeader>
        <SectionTitle>증권사 관리</SectionTitle>
        <SectionDescription>
          증권사 API 정보와 활성 상태를 관리합니다.
        </SectionDescription>
      </SectionHeader>

      <Button
        variant="primary"
        onClick={() => setIsFormOpen((previous) => !previous)}
      >
        {isFormOpen ? '취소' : '증권사 추가'}
      </Button>

      {isFormOpen ? (
        <Card as="section">
          <CardHeader>
            <CardTitle>새 증권사 등록</CardTitle>
          </CardHeader>
          <Form onSubmit={handleSubmit}>
            <Field>
              <FieldLabel htmlFor="broker-code">증권사 코드</FieldLabel>
              <TextInput
                id="broker-code"
                value={formState.code}
                onChange={(event) => handleChange('code', event.target.value)}
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="broker-name">증권사 이름</FieldLabel>
              <TextInput
                id="broker-name"
                value={formState.name}
                onChange={(event) => handleChange('name', event.target.value)}
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="broker-description">설명</FieldLabel>
              <TextInput
                id="broker-description"
                value={formState.description}
                onChange={(event) =>
                  handleChange('description', event.target.value)
                }
                placeholder="증권사 설명"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="broker-api-base-url">
                API 베이스 URL
              </FieldLabel>
              <TextInput
                id="broker-api-base-url"
                type="url"
                value={formState.apiBaseUrl}
                onChange={(event) =>
                  handleChange('apiBaseUrl', event.target.value)
                }
                placeholder="https://api.broker.com"
              />
            </Field>

            <FormActions>
              <Button type="submit" variant="primary">
                등록
              </Button>
              <Button type="button" onClick={resetForm}>
                취소
              </Button>
            </FormActions>
          </Form>
        </Card>
      ) : null}

      <Grid minWidth="280px">
        {brokers.map((broker) => (
          <Card key={broker.id} as="article">
            <CardHeader>
              <CardTitle>{broker.name}</CardTitle>
            </CardHeader>

            <BrokerInfo>
              <BrokerInfoItem>
                <BrokerInfoLabel>코드:</BrokerInfoLabel>
                <BrokerInfoValue>{broker.code}</BrokerInfoValue>
              </BrokerInfoItem>
              <BrokerInfoItem>
                <BrokerInfoLabel>상태:</BrokerInfoLabel>
                <BrokerInfoValue>
                  {broker.isActive ? '활성' : '비활성'}
                </BrokerInfoValue>
              </BrokerInfoItem>
              {broker.description ? (
                <BrokerInfoItem>
                  <BrokerInfoLabel>설명:</BrokerInfoLabel>
                  <BrokerInfoValue>{broker.description}</BrokerInfoValue>
                </BrokerInfoItem>
              ) : null}
              {broker.apiBaseUrl ? (
                <BrokerInfoItem>
                  <BrokerInfoLabel>API URL:</BrokerInfoLabel>
                  <BrokerInfoValue>{broker.apiBaseUrl}</BrokerInfoValue>
                </BrokerInfoItem>
              ) : null}
            </BrokerInfo>

            <CardActions>
              <Button onClick={() => handleToggleActive(broker)}>
                {broker.isActive ? '비활성화' : '활성화'}
              </Button>
              <Button variant="danger" onClick={() => handleDelete(broker)}>
                삭제
              </Button>
            </CardActions>
          </Card>
        ))}

        {brokers.length === 0 ? <p>등록된 증권사가 없습니다.</p> : null}
      </Grid>
    </Section>
  );
};
