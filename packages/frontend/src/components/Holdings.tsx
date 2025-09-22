import React, { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import styled from 'styled-components';
import {
  GET_BROKERAGE_HOLDINGS,
  INCREMENT_BROKERAGE_HOLDING_QUANTITY,
  SET_BROKERAGE_HOLDING_QUANTITY,
  SYNC_BROKERAGE_HOLDING_PRICE,
} from '../graphql/brokerage';
import { GET_TAGS } from '../graphql/tags';
import { GET_TAGS_FOR_HOLDING, SET_HOLDING_TAGS } from '../graphql/holdings';

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

const ActionContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${(props) => props.theme.spacing.xs};

  & > button {
    margin-left: 0;
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

const Field = styled.div`
  width: 100%;
  margin-bottom: ${(props) => props.theme.spacing.md};

  label {
    display: block;
    margin-bottom: ${(props) => props.theme.spacing.xs};
    font-weight: ${(props) => props.theme.typography.fontWeight.medium};
  }
`;

const Input = styled.input`
  width: 100%;
  padding: ${(props) => props.theme.spacing.xs};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.sm};
  font-size: ${(props) => props.theme.typography.fontSize.sm};
  box-sizing: border-box;
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

export const Holdings: React.FC = () => {
  const [selectedHolding, setSelectedHolding] = useState<string | null>(null);
  const [showTagModal, setShowTagModal] = useState(false);
  const [quantityModalHolding, setQuantityModalHolding] =
    useState<Holding | null>(null);

  const {
    data: holdingsData,
    loading: holdingsLoading,
    refetch: refetchHoldings,
  } = useQuery(GET_BROKERAGE_HOLDINGS);
  const { data: tagsData } = useQuery<{ tags: Tag[] }>(GET_TAGS);
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
  const [
    incrementHoldingQuantityMutation,
    { loading: incrementQuantityLoading },
  ] = useMutation(INCREMENT_BROKERAGE_HOLDING_QUANTITY);
  const [setHoldingQuantityMutation, { loading: setQuantityLoading }] =
    useMutation(SET_BROKERAGE_HOLDING_QUANTITY);
  const [syncHoldingPriceMutation, { loading: syncPriceLoading }] = useMutation(
    SYNC_BROKERAGE_HOLDING_PRICE,
  );

  const handleTagManagement = (symbol: string) => {
    setSelectedHolding(symbol);
    setShowTagModal(true);
  };

  const handleQuantityManagement = (holding: Holding) => {
    setQuantityModalHolding(holding);
  };

  const closeQuantityModal = () => {
    setQuantityModalHolding(null);
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

  const handleIncrementQuantity = async (delta: number): Promise<void> => {
    if (!quantityModalHolding) return;

    try {
      const { data } = await incrementHoldingQuantityMutation({
        variables: {
          input: {
            holdingId: quantityModalHolding.id,
            quantityDelta: delta,
          },
        },
      });

      const updatedHolding =
        (data?.incrementBrokerageHoldingQuantity as Holding | undefined) ??
        null;

      if (updatedHolding) {
        setQuantityModalHolding(updatedHolding);
      }

      await refetchHoldings();
    } catch (error) {
      console.error('보유 수량 증가 실패:', error);
      throw error;
    }
  };

  const handleSetQuantity = async (quantity: number): Promise<void> => {
    if (!quantityModalHolding) return;

    try {
      const { data } = await setHoldingQuantityMutation({
        variables: {
          input: {
            holdingId: quantityModalHolding.id,
            quantity,
          },
        },
      });

      const updatedHolding =
        (data?.setBrokerageHoldingQuantity as Holding | undefined) ?? null;

      if (updatedHolding) {
        setQuantityModalHolding(updatedHolding);
      }

      await refetchHoldings();
    } catch (error) {
      console.error('보유 수량 설정 실패:', error);
      throw error;
    }
  };

  const handleSyncHoldingPrice = async (): Promise<void> => {
    if (!quantityModalHolding) return;

    try {
      const { data } = await syncHoldingPriceMutation({
        variables: {
          input: {
            holdingId: quantityModalHolding.id,
          },
        },
      });

      const updatedHolding =
        (data?.syncBrokerageHoldingPrice as Holding | undefined) ?? null;

      if (updatedHolding) {
        setQuantityModalHolding(updatedHolding);
      }

      await refetchHoldings();
    } catch (error) {
      console.error('현재가 동기화 실패:', error);
      throw error;
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
                  <ActionContainer>
                    <Button onClick={() => handleQuantityManagement(holding)}>
                      수량 조정
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => handleTagManagement(holding.symbol)}
                    >
                      태그 관리
                    </Button>
                  </ActionContainer>
                </Td>
              </tr>
            );
          })}
        </tbody>
      </Table>

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
      {quantityModalHolding && (
        <QuantityModal
          holding={quantityModalHolding}
          onClose={closeQuantityModal}
          onIncrement={handleIncrementQuantity}
          onSetQuantity={handleSetQuantity}
          onSyncPrice={handleSyncHoldingPrice}
          isIncrementLoading={incrementQuantityLoading}
          isSetLoading={setQuantityLoading}
          isSyncLoading={syncPriceLoading}
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

interface QuantityModalProps {
  holding: Holding;
  onIncrement: (delta: number) => Promise<void>;
  onSetQuantity: (quantity: number) => Promise<void>;
  onSyncPrice: () => Promise<void>;
  isIncrementLoading: boolean;
  isSetLoading: boolean;
  isSyncLoading: boolean;
  onClose: () => void;
}

const QuantityModal: React.FC<QuantityModalProps> = ({
  holding,
  onIncrement,
  onSetQuantity,
  onSyncPrice,
  isIncrementLoading,
  isSetLoading,
  isSyncLoading,
  onClose,
}) => {
  const [incrementValue, setIncrementValue] = useState('');
  const [setValue, setSetValue] = useState('');

  useEffect(() => {
    setIncrementValue('');
    setSetValue('');
  }, [holding]);

  const parsedIncrement = parseFloat(incrementValue);
  const canIncrement =
    !Number.isNaN(parsedIncrement) && parsedIncrement > 0;

  const parsedSet = parseFloat(setValue);
  const canSet = !Number.isNaN(parsedSet) && parsedSet >= 0;

  const handleIncrementClick = async () => {
    if (!canIncrement || isIncrementLoading) {
      return;
    }

    try {
      await onIncrement(parsedIncrement);
      setIncrementValue('');
    } catch (error) {
      console.error('수량 증가 처리 중 오류:', error);
    }
  };

  const handleSetClick = async () => {
    if (!canSet || isSetLoading) {
      return;
    }

    try {
      await onSetQuantity(parsedSet);
    } catch (error) {
      console.error('수량 설정 처리 중 오류:', error);
    }
  };

  const handleSyncClick = async () => {
    if (isSyncLoading) {
      return;
    }

    try {
      await onSyncPrice();
    } catch (error) {
      console.error('현재가 동기화 처리 중 오류:', error);
    }
  };

  return (
    <Modal onClick={onClose}>
      <ModalContent onClick={(event) => event.stopPropagation()}>
        <h3>{holding.symbol} 수량 조정</h3>
        <p>현재 수량: {holding.quantity.toLocaleString()}</p>
        <p>현재가: ${holding.currentPrice.toFixed(2)}</p>

        <Field>
          <label htmlFor="incrementQuantity">추가 수량</label>
          <Input
            id="incrementQuantity"
            type="number"
            value={incrementValue}
            onChange={(event) => setIncrementValue(event.target.value)}
            min="0"
            step="any"
          />
          <div style={{ marginTop: '8px' }}>
            <Button
              variant="primary"
              onClick={handleIncrementClick}
              disabled={!canIncrement || isIncrementLoading}
              style={{ marginLeft: 0 }}
            >
              수량 증가
            </Button>
          </div>
        </Field>

        <Field>
          <label htmlFor="setQuantity">설정 수량</label>
          <Input
            id="setQuantity"
            type="number"
            value={setValue}
            onChange={(event) => setSetValue(event.target.value)}
            min="0"
            step="any"
          />
          <div style={{ marginTop: '8px' }}>
            <Button
              variant="primary"
              onClick={handleSetClick}
              disabled={!canSet || isSetLoading}
              style={{ marginLeft: 0 }}
            >
              수량 설정
            </Button>
          </div>
        </Field>

        <Field>
          <Button
            variant="secondary"
            onClick={handleSyncClick}
            disabled={isSyncLoading}
            style={{ marginLeft: 0 }}
          >
            현재가 동기화
          </Button>
        </Field>

        <div>
          <Button
            onClick={onClose}
            disabled={isIncrementLoading || isSetLoading || isSyncLoading}
            style={{ marginLeft: 0 }}
          >
            취소
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
};
