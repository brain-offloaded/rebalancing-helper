import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import styled from 'styled-components';
import { GET_BROKERAGE_HOLDINGS } from '../graphql/brokerage';
import { GET_TAGS } from '../graphql/tags';
import {
  GET_TAGS_FOR_HOLDING,
  SET_HOLDING_TAGS,
  GET_MANUAL_HOLDINGS,
  CREATE_MANUAL_HOLDING,
  INCREASE_MANUAL_HOLDING,
  SET_MANUAL_HOLDING_QUANTITY,
  DELETE_MANUAL_HOLDING,
  SYNC_MANUAL_HOLDING_PRICE,
} from '../graphql/holdings';
import { GET_MARKETS } from '../graphql/markets';

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

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: ${(props) => props.theme.spacing.xs}
    ${(props) => props.theme.spacing.sm};
  font-size: ${(props) => props.theme.typography.fontSize.xs};
  border: none;
  border-radius: ${(props) => props.theme.borderRadius.sm};
  cursor: pointer;
  margin-left: ${(props) => props.theme.spacing.xs};

  ${(props) =>
    props.variant === 'primary'
      ? `
    background-color: ${props.theme.colors.primary};
    color: white;
  `
      : `
    background-color: ${props.theme.colors.light};
    color: ${props.theme.colors.text};
    border: 1px solid ${props.theme.colors.border};
  `}
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

const ManualActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.spacing.xs};

  & > ${Button} {
    margin-left: 0;
  }
`;

const PrimaryButton = styled(Button)`
  margin-left: 0;
`;

interface Holding {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  currentPrice: number;
  marketValue: number;
  averageCost: number | null;
  currency: string;
  accountId: string;
  lastUpdated: string;
}

interface Tag {
  id: string;
  name: string;
  description: string | null;
  color: string;
}

interface ManualHolding {
  id: string;
  market: string;
  symbol: string;
  name: string;
  quantity: number;
  currentPrice: number;
  marketValue: number;
  currency: string;
  lastUpdated: string;
}

interface MarketOption {
  id: string;
  code: string;
  displayName: string;
  yahooSuffix: string | null;
}

export const Holdings: React.FC = () => {
  const [selectedHolding, setSelectedHolding] = useState<string | null>(null);
  const [showTagModal, setShowTagModal] = useState(false);
  const [manualMarket, setManualMarket] = useState('');
  const [manualSymbol, setManualSymbol] = useState('');
  const [manualQuantity, setManualQuantity] = useState('');

  const { data: holdingsData, loading: holdingsLoading } = useQuery(
    GET_BROKERAGE_HOLDINGS,
  );
  const { data: tagsData } = useQuery<{ tags: Tag[] }>(GET_TAGS);
  const { data: marketsData, loading: marketsLoading } = useQuery<{
    markets: MarketOption[];
  }>(GET_MARKETS);
  const {
    data: manualHoldingsData,
    loading: manualHoldingsLoading,
    refetch: refetchManualHoldings,
  } = useQuery<{ manualHoldings: ManualHolding[] }>(GET_MANUAL_HOLDINGS);
  const {
    data: holdingTagsData,
    loading: holdingTagsLoading,
    refetch: refetchHoldingTags,
  } = useQuery<{
    tagsForHolding: string[];
  }>(GET_TAGS_FOR_HOLDING, {
    variables: { holdingSymbol: selectedHolding },
    skip: !selectedHolding,
  });

  const [setHoldingTags] = useMutation(SET_HOLDING_TAGS);
  const [createManualHoldingMutation, { loading: creatingManualHolding }] =
    useMutation(CREATE_MANUAL_HOLDING);
  const [increaseManualHoldingMutation] = useMutation(INCREASE_MANUAL_HOLDING);
  const [setManualHoldingQuantityMutation] = useMutation(
    SET_MANUAL_HOLDING_QUANTITY,
  );
  const [deleteManualHoldingMutation] = useMutation(DELETE_MANUAL_HOLDING);
  const [syncManualHoldingPriceMutation] = useMutation(
    SYNC_MANUAL_HOLDING_PRICE,
  );

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

  const manualHoldings = manualHoldingsData?.manualHoldings ?? [];
  const markets = useMemo(
    () => marketsData?.markets ?? [],
    [marketsData?.markets],
  );

  useEffect(() => {
    if (markets.length > 0 && !manualMarket) {
      setManualMarket(markets[0].code);
    }
  }, [markets, manualMarket]);

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

  const handleManualSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    const market = manualMarket.trim().toUpperCase();
    const symbol = manualSymbol.trim().toUpperCase();
    const quantityValue = Number(manualQuantity);

    if (
      !market ||
      !symbol ||
      !Number.isFinite(quantityValue) ||
      quantityValue <= 0
    ) {
      return;
    }

    try {
      await createManualHoldingMutation({
        variables: {
          input: {
            market,
            symbol,
            quantity: quantityValue,
          },
        },
      });
      setManualMarket('');
      setManualSymbol('');
      setManualQuantity('');
      await refetchManualHoldings();
    } catch (error) {
      console.error('수동 보유 종목 생성 실패:', error);
    }
  };

  const handleManualIncrease = async (holding: ManualHolding) => {
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
            market: holding.market,
            symbol: holding.symbol,
            quantityDelta,
          },
        },
      });
      await refetchManualHoldings();
    } catch (error) {
      console.error('수동 보유 종목 수량 증가 실패:', error);
    }
  };

  const handleManualQuantitySet = async (holding: ManualHolding) => {
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
            market: holding.market,
            symbol: holding.symbol,
            quantity,
          },
        },
      });
      await refetchManualHoldings();
    } catch (error) {
      console.error('수동 보유 종목 수량 설정 실패:', error);
    }
  };

  const handleManualDelete = async (holding: ManualHolding) => {
    try {
      await deleteManualHoldingMutation({
        variables: {
          input: {
            market: holding.market,
            symbol: holding.symbol,
          },
        },
      });
      await refetchManualHoldings();
    } catch (error) {
      console.error('수동 보유 종목 삭제 실패:', error);
    }
  };

  const handleManualSync = async (holding: ManualHolding) => {
    try {
      await syncManualHoldingPriceMutation({
        variables: {
          input: {
            market: holding.market,
            symbol: holding.symbol,
          },
        },
      });
      await refetchManualHoldings();
    } catch (error) {
      console.error('수동 보유 종목 가격 동기화 실패:', error);
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

      <Table>
        <thead>
          <tr>
            <Th>종목코드</Th>
            <Th>종목명</Th>
            <Th>수량</Th>
            <Th>현재가</Th>
            <Th>평가금액</Th>
            <Th>평균단가</Th>
            <Th>태그</Th>
            <Th>관리</Th>
          </tr>
        </thead>
        <tbody>
          {holdingsData?.brokerageHoldings?.map((holding: Holding) => {
            const tags = getTagsForHolding(holding.symbol);
            return (
              <tr key={holding.id}>
                <Td>{holding.symbol}</Td>
                <Td>{holding.name}</Td>
                <Td>{holding.quantity.toLocaleString()}</Td>
                <Td>${holding.currentPrice.toFixed(2)}</Td>
                <Td>${holding.marketValue.toFixed(2)}</Td>
                <Td>
                  {holding.averageCost != null
                    ? `$${holding.averageCost.toFixed(2)}`
                    : '-'}
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
                  <Button
                    variant="primary"
                    onClick={() => handleTagManagement(holding.symbol)}
                  >
                    태그 관리
                  </Button>
                </Td>
              </tr>
            );
          })}
        </tbody>
      </Table>

      <Section>
        <SectionTitle>수동 보유 종목</SectionTitle>
        <SectionDescription>
          시장에 등록된 종목을 직접 추가하고 수량 및 현재가를 관리할 수
          있습니다.
        </SectionDescription>

        <ManualForm onSubmit={handleManualSubmit}>
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
            disabled={creatingManualHolding || !manualMarket}
          >
            수동 추가
          </PrimaryButton>
        </ManualForm>

        {manualHoldingsLoading ? (
          <div>수동 보유 종목을 불러오는 중...</div>
        ) : manualHoldings.length === 0 ? (
          <p>등록된 수동 보유 종목이 없습니다.</p>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>시장</Th>
                <Th>종목코드</Th>
                <Th>종목명</Th>
                <Th>수량</Th>
                <Th>현재가</Th>
                <Th>평가금액</Th>
                <Th>통화</Th>
                <Th>최근 갱신</Th>
                <Th>관리</Th>
              </tr>
            </thead>
            <tbody>
              {manualHoldings.map((holding) => (
                <tr key={holding.id}>
                  <Td>{holding.market}</Td>
                  <Td>{holding.symbol}</Td>
                  <Td>{holding.name}</Td>
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
                  <Td>{holding.currency}</Td>
                  <Td>{new Date(holding.lastUpdated).toLocaleString()}</Td>
                  <Td>
                    <ManualActions>
                      <Button
                        variant="primary"
                        type="button"
                        onClick={() => handleTagManagement(holding.symbol)}
                      >
                        태그 관리
                      </Button>
                      <Button
                        type="button"
                        onClick={() => handleManualIncrease(holding)}
                      >
                        수량 증가
                      </Button>
                      <Button
                        type="button"
                        onClick={() => handleManualQuantitySet(holding)}
                      >
                        수량 설정
                      </Button>
                      <Button
                        type="button"
                        onClick={() => handleManualSync(holding)}
                      >
                        현재가 동기화
                      </Button>
                      <Button
                        type="button"
                        onClick={() => handleManualDelete(holding)}
                      >
                        삭제
                      </Button>
                    </ManualActions>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
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
