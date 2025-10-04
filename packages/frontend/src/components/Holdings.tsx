import React, { useEffect, useMemo, useState } from 'react';
// switch to generated hooks
import {
  useGetHoldingsQuery,
  useGetTagsQuery,
  useGetMarketsQuery,
  useGetTagsForHoldingQuery,
  useSetHoldingTagsMutation,
  useCreateManualHoldingMutation,
  useIncreaseManualHoldingMutation,
  useSetManualHoldingQuantityMutation,
  useDeleteManualHoldingMutation,
  useSyncManualHoldingPriceMutation,
  useGetBrokerageAccountsQuery,
} from '../graphql/__generated__';
import styled from 'styled-components';
// remove manual document imports

const Container = styled.div`
  padding: ${(props) => props.theme.spacing.lg};
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: ${(props) => props.theme.spacing.md};
  background: white;
  border-radius: ${(props) => props.theme.borderRadius.md};
  overflow: hidden;
  box-shadow: ${(props) => props.theme.shadows.sm};
`;

const Th = styled.th`
  background-color: ${(props) => props.theme.colors.primary};
  color: white;
  padding: ${(props) => props.theme.spacing.md};
  text-align: left;
  font-weight: ${(props) => props.theme.typography.fontWeight.semibold};
`;

const Td = styled.td`
  padding: ${(props) => props.theme.spacing.md};
  border-bottom: 1px solid ${(props) => props.theme.colors.border};
  vertical-align: top;
`;

const CellContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing.xs};
`;

const PrimaryText = styled.span`
  font-weight: ${(props) => props.theme.typography.fontWeight.medium};
  color: ${(props) => props.theme.colors.text};
`;

const SecondaryText = styled.span`
  color: ${(props) => props.theme.colors.text};
  font-size: ${(props) => props.theme.typography.fontSize.xs};
  opacity: 0.7;
`;

const TagContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${(props) => props.theme.spacing.xs};
  margin-top: ${(props) => props.theme.spacing.xs};
`;

const Tag = styled.span<{ color: string }>`
  background-color: ${(props) => props.color};
  color: white;
  padding: ${(props) => props.theme.spacing.xs}
    ${(props) => props.theme.spacing.sm};
  border-radius: ${(props) => props.theme.borderRadius.sm};
  font-size: ${(props) => props.theme.typography.fontSize.xs};
  font-weight: ${(props) => props.theme.typography.fontWeight.medium};
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: ${(props) => props.theme.spacing.xs}
    ${(props) => props.theme.spacing.sm};
  font-size: ${(props) => props.theme.typography.fontSize.xs};
  border: none;
  border-radius: ${(props) => props.theme.borderRadius.sm};
  cursor: pointer;
  margin-left: ${(props) => props.theme.spacing.xs};
  transition: background-color 0.2s ease;

  ${(props) => {
    switch (props.variant) {
      case 'primary':
        return `
          background-color: ${props.theme.colors.primary};
          color: white;
        `;
      case 'danger':
        return `
          background-color: ${props.theme.colors.danger};
          color: white;
        `;
      default:
        return `
          background-color: ${props.theme.colors.light};
          color: ${props.theme.colors.text};
          border: 1px solid ${props.theme.colors.border};
        `;
    }
  }}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  padding: ${(props) => props.theme.spacing.xl};
  border-radius: ${(props) => props.theme.borderRadius.md};
  max-width: 500px;
  width: 90%;
  max-height: 70vh;
  overflow-y: auto;
`;

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: ${(props) => props.theme.spacing.sm};
`;

const Checkbox = styled.input`
  margin-right: ${(props) => props.theme.spacing.sm};
`;

const Section = styled.section`
  margin-top: ${(props) => props.theme.spacing.xl};
`;

const SectionTitle = styled.h2`
  margin: 0;
  font-size: ${(props) => props.theme.typography.fontSize.lg};
`;

const SectionDescription = styled.p`
  margin-top: ${(props) => props.theme.spacing.xs};
  color: ${(props) => props.theme.colors.text};
  opacity: 0.8;
`;

const ManualForm = styled.form`
  display: flex;
  flex-wrap: wrap;
  gap: ${(props) => props.theme.spacing.sm};
  align-items: flex-end;
  margin-top: ${(props) => props.theme.spacing.md};
`;

const ManualFormGroup = styled.label`
  display: flex;
  flex-direction: column;
  font-size: ${(props) => props.theme.typography.fontSize.sm};
  color: ${(props) => props.theme.colors.text};
`;

const ManualInput = styled.input`
  margin-top: ${(props) => props.theme.spacing.xs};
  padding: ${(props) => props.theme.spacing.xs};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.sm};
  min-width: 120px;
`;

const ManualSelect = styled.select`
  margin-top: ${(props) => props.theme.spacing.xs};
  padding: ${(props) => props.theme.spacing.xs};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.sm};
  min-width: 160px;
`;

const ActionGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: ${(props) => props.theme.spacing.xs};

  & > ${Button} {
    margin-left: 0;
    width: 100%;
  }
`;

const PrimaryButton = styled(Button)`
  margin-left: 0;
`;

const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${(props) => props.theme.spacing.sm};
  align-items: center;
  margin-top: ${(props) => props.theme.spacing.md};
`;

interface Holding {
  id: string;
  source: 'BROKERAGE' | 'MANUAL';
  accountId: string;
  market: string | null;
  symbol: string;
  name: string;
  quantity: number;
  currentPrice: number;
  marketValue: number;
  averageCost: number | null;
  currency: string;
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
}

interface Tag {
  id: string;
  name: string;
  description: string | null;
  color: string;
}

// MarketOption interface removed (derived types available from generated schema if needed)

export const Holdings: React.FC = () => {
  const [selectedHolding, setSelectedHolding] = useState<string | null>(null);
  const [showTagModal, setShowTagModal] = useState(false);
  const [manualMarket, setManualMarket] = useState('');
  const [manualSymbol, setManualSymbol] = useState('');
  const [manualQuantity, setManualQuantity] = useState('');
  const [manualAccountId, setManualAccountId] = useState('');
  const [syncingAll, setSyncingAll] = useState(false);

  const {
    data: holdingsData,
    loading: holdingsLoading,
    refetch: refetchHoldings,
  } = useGetHoldingsQuery();
  const { data: tagsData } = useGetTagsQuery();
  const { data: marketsData, loading: marketsLoading } = useGetMarketsQuery();
  const {
    data: holdingTagsData,
    loading: holdingTagsLoading,
    refetch: refetchHoldingTags,
  } = useGetTagsForHoldingQuery({
    variables: { holdingSymbol: selectedHolding as string },
    skip: !selectedHolding,
  });
  const {
    data: brokerageAccountsData,
    loading: brokerageAccountsLoading,
  } = useGetBrokerageAccountsQuery();

  const [setHoldingTags] = useSetHoldingTagsMutation();
  const [createManualHoldingMutation, { loading: creatingManualHolding }] =
    useCreateManualHoldingMutation();
  const [increaseManualHoldingMutation] = useIncreaseManualHoldingMutation();
  const [setManualHoldingQuantityMutation] =
    useSetManualHoldingQuantityMutation();
  const [deleteManualHoldingMutation] = useDeleteManualHoldingMutation();
  const [syncManualHoldingPriceMutation] = useSyncManualHoldingPriceMutation();

  const handleTagManagement = (symbol: string) => {
    setSelectedHolding(symbol);
    setShowTagModal(true);
  };

  const handleTagUpdate = async (tagIds: string[]) => {
    if (!selectedHolding) return;

    try {
      await setHoldingTags({
        variables: {
          input: {
            holdingSymbol: selectedHolding,
            tagIds,
          },
        },
      });
      refetchHoldingTags();
      setShowTagModal(false);
    } catch (error) {
      console.error('태그 업데이트 실패:', error);
    }
  };

  const getTagsForHolding = (symbol: string): Tag[] => {
    if (symbol !== selectedHolding || holdingTagsLoading) {
      return [];
    }

    const tagIds = holdingTagsData?.tagsForHolding ?? [];
    if (tagIds.length === 0) {
      return [];
    }

    const tagsById = new Map<string, Tag>(
      (tagsData?.tags ?? []).map((tag) => [tag.id, tag]),
    );

    return tagIds
      .map((tagId) => tagsById.get(tagId))
      .filter((tag): tag is Tag => Boolean(tag));
  };

  const holdings = holdingsData?.holdings ?? [];
  const manualAccounts = useMemo(
    () =>
      (brokerageAccountsData?.brokerageAccounts ?? []).filter(
        (account) => account.syncMode === 'MANUAL',
      ),
    [brokerageAccountsData?.brokerageAccounts],
  );
  const accountNameById = useMemo(
    () =>
      new Map(
        (brokerageAccountsData?.brokerageAccounts ?? []).map((account) => [
          account.id,
          account.name,
        ]),
      ),
    [brokerageAccountsData?.brokerageAccounts],
  );
  const manualHoldings = holdings.filter(
    (holding) => holding.source === 'MANUAL',
  );
  const markets = useMemo(
    () => marketsData?.markets ?? [],
    [marketsData?.markets],
  );

  useEffect(() => {
    if (markets.length > 0 && !manualMarket) {
      setManualMarket(markets[0].code);
    }
  }, [markets, manualMarket]);

  useEffect(() => {
    if (manualAccounts.length === 0) {
      setManualAccountId('');
      return;
    }

    if (!manualAccountId) {
      setManualAccountId(manualAccounts[0].id);
      return;
    }

    if (!manualAccounts.some((account) => account.id === manualAccountId)) {
      setManualAccountId(manualAccounts[0].id);
    }
  }, [manualAccounts, manualAccountId]);

  const formatCurrencyValue = (value: number, currency: string) => {
    if (!Number.isFinite(value)) {
      return '-';
    }
    const formatted = value.toFixed(2);
    if (currency === 'USD') {
      return `$${formatted}`;
    }
    if (currency === 'KRW') {
      return `₩${Math.round(value).toLocaleString()}`;
    }
    return `${currency} ${formatted}`;
  };

  const formatLastUpdated = (value: string) => {
    if (!value) {
      return '-';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '-';
    }

    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    const hours = `${date.getHours()}`.padStart(2, '0');
    const minutes = `${date.getMinutes()}`.padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  const formatMarketWithSymbol = (market: string | null | undefined, symbol: string) => {
    if (market && market.trim().length > 0) {
      return `${market} · ${symbol}`;
    }

    return symbol;
  };

  const handleManualSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    const market = manualMarket.trim().toUpperCase();
    const symbol = manualSymbol.trim().toUpperCase();
    if (!market || !symbol || manualQuantity.trim() === '') {
      return;
    }

    if (!manualAccountId) {
      alert('수동 입력 계좌를 선택해주세요.');
      return;
    }

    const quantityValue = Number(manualQuantity);

    if (!Number.isFinite(quantityValue) || quantityValue < 0) {
      return;
    }

    try {
      await createManualHoldingMutation({
        variables: {
          input: {
            accountId: manualAccountId,
            market,
            symbol,
            quantity: quantityValue,
          },
        },
      });
      setManualMarket('');
      setManualSymbol('');
      setManualQuantity('');
      await refetchHoldings();
    } catch (error) {
      console.error('수동 보유 종목 생성 실패:', error);
    }
  };

  const handleManualIncrease = async (holding: Holding) => {
    if (holding.source !== 'MANUAL' || !holding.market || !holding.accountId) {
      console.error('잘못된 수동 보유 종목 데이터입니다.');
      return;
    }
    const input = window.prompt(
      `${holding.symbol} 추가 수량을 입력하세요`,
      '1',
    );
    if (input === null) {
      return;
    }
    const quantityDelta = Number(input);
    if (!Number.isFinite(quantityDelta) || quantityDelta <= 0) {
      return;
    }

    try {
      await increaseManualHoldingMutation({
        variables: {
          input: {
            accountId: holding.accountId,
            market: holding.market,
            symbol: holding.symbol,
            quantityDelta,
          },
        },
      });
      await refetchHoldings();
    } catch (error) {
      console.error('수동 보유 종목 수량 증가 실패:', error);
    }
  };

  const handleManualQuantitySet = async (holding: Holding) => {
    if (holding.source !== 'MANUAL' || !holding.market || !holding.accountId) {
      console.error('잘못된 수동 보유 종목 데이터입니다.');
      return;
    }
    const input = window.prompt(
      `${holding.symbol}의 목표 수량을 입력하세요`,
      holding.quantity.toString(),
    );
    if (input === null) {
      return;
    }
    const quantity = Number(input);
    if (!Number.isFinite(quantity) || quantity < 0) {
      return;
    }

    try {
      await setManualHoldingQuantityMutation({
        variables: {
          input: {
            accountId: holding.accountId,
            market: holding.market,
            symbol: holding.symbol,
            quantity,
          },
        },
      });
      await refetchHoldings();
    } catch (error) {
      console.error('수동 보유 종목 수량 설정 실패:', error);
    }
  };

  const handleManualDelete = async (holding: Holding) => {
    if (holding.source !== 'MANUAL' || !holding.market || !holding.accountId) {
      console.error('잘못된 수동 보유 종목 데이터입니다.');
      return;
    }
    try {
      await deleteManualHoldingMutation({
        variables: {
          input: {
            accountId: holding.accountId,
            market: holding.market,
            symbol: holding.symbol,
          },
        },
      });
      await refetchHoldings();
    } catch (error) {
      console.error('수동 보유 종목 삭제 실패:', error);
    }
  };

  const handleManualSync = async (holding: Holding) => {
    if (holding.source !== 'MANUAL' || !holding.market || !holding.accountId) {
      console.error('잘못된 수동 보유 종목 데이터입니다.');
      return;
    }
    try {
      await syncManualHoldingPriceMutation({
        variables: {
          input: {
            accountId: holding.accountId,
            market: holding.market,
            symbol: holding.symbol,
          },
        },
      });
      await refetchHoldings();
    } catch (error) {
      console.error('수동 보유 종목 가격 동기화 실패:', error);
    }
  };

  const handleManualSyncAll = async () => {
    if (manualHoldings.length === 0) {
      return;
    }

    setSyncingAll(true);
    try {
      const validHoldings = manualHoldings.filter(
        (holding) => holding.market && holding.accountId,
      );

      await Promise.all(
        validHoldings.map((holding) =>
          syncManualHoldingPriceMutation({
            variables: {
              input: {
                accountId: holding.accountId as string,
                market: holding.market as string,
                symbol: holding.symbol,
              },
            },
          }),
        ),
      );
      await refetchHoldings();
    } catch (error) {
      console.error('수동 보유 종목 일괄 동기화 실패:', error);
    } finally {
      setSyncingAll(false);
    }
  };

  if (holdingsLoading) return <div>로딩 중...</div>;

  return (
    <Container>
      <h2>보유 종목</h2>
      <p>
        증권사에서 가져온 보유 종목 목록입니다. 각 종목에 태그를 설정할 수
        있습니다.
      </p>

      <Toolbar>
        <Button
          variant="secondary"
          type="button"
          onClick={handleManualSyncAll}
          disabled={syncingAll || manualHoldings.length === 0}
        >
          {syncingAll ? '현재가 동기화 중...' : '수동 종목 현재가 전체 동기화'}
        </Button>
      </Toolbar>

      <Table>
        <thead>
          <tr>
            <Th>계좌</Th>
            <Th>종목</Th>
            <Th>수량</Th>
            <Th>현재가</Th>
            <Th>평가금액</Th>
            <Th>마지막 업데이트</Th>
            <Th>태그</Th>
            <Th>관리</Th>
          </tr>
        </thead>
        <tbody>
          {holdings.length === 0 ? (
            <tr>
              <Td colSpan={8}>등록된 보유 종목이 없습니다.</Td>
            </tr>
          ) : (
            holdings.map((holding) => {
              const tags = getTagsForHolding(holding.symbol);
              const accountName =
                accountNameById.get(holding.accountId) ?? '미지정 계좌';
              const sourceDescription =
                holding.source === 'MANUAL' ? '수동 입력' : '자동 연동';
              return (
                <tr key={holding.id}>
                  <Td>
                    <CellContent>
                      <PrimaryText>{accountName}</PrimaryText>
                      <SecondaryText>{sourceDescription}</SecondaryText>
                    </CellContent>
                  </Td>
                  <Td>
                    <CellContent>
                      <PrimaryText>{holding.name}</PrimaryText>
                      <SecondaryText>
                        {formatMarketWithSymbol(holding.market, holding.symbol)}
                      </SecondaryText>
                    </CellContent>
                  </Td>
                  <Td>{holding.quantity.toLocaleString()}</Td>
                  <Td>
                    {formatCurrencyValue(
                      holding.currentPrice,
                      holding.currency,
                    )}
                  </Td>
                  <Td>
                    {formatCurrencyValue(holding.marketValue, holding.currency)}
                  </Td>
                  <Td>
                    <CellContent>
                      <PrimaryText>
                        {formatLastUpdated(holding.lastUpdated)}
                      </PrimaryText>
                    </CellContent>
                  </Td>
                  <Td>
                    <TagContainer>
                      {tags.map((tag) => (
                        <Tag key={tag.id} color={tag.color}>
                          {tag.name}
                        </Tag>
                      ))}
                    </TagContainer>
                  </Td>
                  <Td>
                    <ActionGroup>
                      <Button
                        variant="primary"
                        onClick={() => handleTagManagement(holding.symbol)}
                      >
                        태그 관리
                      </Button>
                      {holding.source === 'MANUAL' && (
                        <>
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => handleManualIncrease(holding)}
                          >
                            수량 증가
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => handleManualQuantitySet(holding)}
                          >
                            수량 설정
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => handleManualSync(holding)}
                          >
                            현재가 동기화
                          </Button>
                          <Button
                            type="button"
                            variant="danger"
                            onClick={() => handleManualDelete(holding)}
                          >
                            삭제
                          </Button>
                        </>
                      )}
                    </ActionGroup>
                  </Td>
                </tr>
              );
            })
          )}
        </tbody>
      </Table>

      <Section>
        <SectionTitle>수동 보유 종목</SectionTitle>
        <SectionDescription>
          시장에 등록된 종목을 직접 추가하면 위 보유 종목 목록에 함께
          표시됩니다.
        </SectionDescription>

        <ManualForm onSubmit={handleManualSubmit}>
          <ManualFormGroup>
            계좌
            <ManualSelect
              value={manualAccountId}
              onChange={(event) => setManualAccountId(event.target.value)}
              disabled={
                brokerageAccountsLoading || manualAccounts.length === 0
              }
            >
              <option value="" disabled>
                {brokerageAccountsLoading
                  ? '계좌 불러오는 중...'
                  : '수동 입력 계정을 먼저 생성하세요'}
              </option>
              {manualAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                  {account.broker?.name ? ` / ${account.broker.name}` : ''}
                </option>
              ))}
            </ManualSelect>
          </ManualFormGroup>
          <ManualFormGroup>
            시장
            <ManualSelect
              value={manualMarket}
              onChange={(event) => setManualMarket(event.target.value)}
              disabled={marketsLoading || markets.length === 0}
            >
              <option value="" disabled>
                {marketsLoading ? '시장 불러오는 중...' : '시장 선택'}
              </option>
              {markets.map((market) => (
                <option key={market.id} value={market.code}>
                  {`${market.displayName} (${market.code})`}
                </option>
              ))}
            </ManualSelect>
          </ManualFormGroup>
          <ManualFormGroup>
            종목 코드
            <ManualInput
              value={manualSymbol}
              onChange={(event) => setManualSymbol(event.target.value)}
              placeholder="예: VOO"
            />
          </ManualFormGroup>
          <ManualFormGroup>
            수량
            <ManualInput
              type="number"
              min="0"
              step="0.01"
              value={manualQuantity}
              onChange={(event) => setManualQuantity(event.target.value)}
              placeholder="예: 1"
            />
          </ManualFormGroup>
          <PrimaryButton
            type="submit"
            variant="primary"
            disabled={
              creatingManualHolding ||
              !manualMarket ||
              !manualAccountId ||
              brokerageAccountsLoading
            }
          >
            수동 추가
          </PrimaryButton>
        </ManualForm>

        {manualAccounts.length === 0 ? (
          <p>
            수동 입력을 사용하려면 먼저 증권사 계정 관리에서 수동 입력 계정을
            생성하세요.
          </p>
        ) : manualHoldings.length === 0 ? (
          <p>등록된 수동 보유 종목이 없습니다.</p>
        ) : (
          <p>추가된 수동 보유 종목은 위 보유 목록에서 함께 관리됩니다.</p>
        )}
      </Section>

      {showTagModal && selectedHolding && (
        <TagModal
          holding={selectedHolding}
          tags={tagsData?.tags || []}
          currentTags={
            holdingTagsLoading ? null : holdingTagsData?.tagsForHolding || []
          }
          isLoading={holdingTagsLoading}
          onUpdate={handleTagUpdate}
          onClose={() => setShowTagModal(false)}
        />
      )}
    </Container>
  );
};

interface TagModalProps {
  holding: string;
  tags: Tag[];
  currentTags: string[] | null;
  isLoading: boolean;
  onUpdate: (tagIds: string[]) => void;
  onClose: () => void;
}

const TagModal: React.FC<TagModalProps> = ({
  holding,
  tags,
  currentTags,
  isLoading,
  onUpdate,
  onClose,
}) => {
  const [selectedTags, setSelectedTags] = useState<string[]>(currentTags ?? []);

  useEffect(() => {
    setSelectedTags(currentTags ?? []);
  }, [currentTags, holding]);

  const handleTagToggle = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId],
    );
  };

  const handleSubmit = () => {
    onUpdate(selectedTags);
  };

  return (
    <Modal onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <h3>{holding} 태그 관리</h3>

        <div style={{ marginBottom: '20px' }}>
          {isLoading ? (
            <span>태그를 불러오는 중...</span>
          ) : (
            tags.map((tag) => (
              <CheckboxContainer key={tag.id}>
                <Checkbox
                  type="checkbox"
                  checked={selectedTags.includes(tag.id)}
                  onChange={() => handleTagToggle(tag.id)}
                  disabled={isLoading}
                />
                <Tag color={tag.color}>{tag.name}</Tag>
                {tag.description && (
                  <span
                    style={{
                      marginLeft: '8px',
                      fontSize: '12px',
                      color: '#666',
                    }}
                  >
                    {tag.description}
                  </span>
                )}
              </CheckboxContainer>
            ))
          )}
        </div>

        <div>
          <Button variant="primary" onClick={handleSubmit} disabled={isLoading}>
            적용
          </Button>
          <Button onClick={onClose} disabled={isLoading}>
            취소
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
};
