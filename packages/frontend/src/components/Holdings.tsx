import React, { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import styled from 'styled-components';
import {
  GET_BROKERAGE_HOLDINGS,
  PATCH_BROKERAGE_HOLDING_QUANTITY,
  PUT_BROKERAGE_HOLDING_QUANTITY,
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

const ManualControls = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing.xs};
`;

const ControlRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.spacing.xs};
  flex-wrap: wrap;
`;

const NumberInput = styled.input`
  width: 100px;
  padding: ${(props) => props.theme.spacing.xs};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.sm};
  font-size: ${(props) => props.theme.typography.fontSize.xs};
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
  const [patchInputs, setPatchInputs] = useState<Record<string, string>>({});
  const [putInputs, setPutInputs] = useState<Record<string, string>>({});
  const [patchingHoldingId, setPatchingHoldingId] = useState<string | null>(null);
  const [puttingHoldingId, setPuttingHoldingId] = useState<string | null>(null);
  const [syncingHoldingId, setSyncingHoldingId] = useState<string | null>(null);

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
  const [patchHoldingQuantity, { loading: patchLoading }] = useMutation(
    PATCH_BROKERAGE_HOLDING_QUANTITY,
  );
  const [putHoldingQuantity, { loading: putLoading }] = useMutation(
    PUT_BROKERAGE_HOLDING_QUANTITY,
  );
  const [syncHoldingPrice, { loading: syncLoading }] = useMutation(
    SYNC_BROKERAGE_HOLDING_PRICE,
  );

  const handlePatchInputChange = (holdingId: string, value: string) => {
    setPatchInputs((prev) => ({ ...prev, [holdingId]: value }));
  };

  const handlePutInputChange = (holdingId: string, value: string) => {
    setPutInputs((prev) => ({ ...prev, [holdingId]: value }));
  };

  const handlePatchQuantity = async (holding: Holding) => {
    const rawValue = patchInputs[holding.id];
    if (!rawValue) return;

    const quantityDelta = Number(rawValue);
    if (Number.isNaN(quantityDelta) || quantityDelta <= 0) {
      return;
    }

    setPatchingHoldingId(holding.id);
    try {
      await patchHoldingQuantity({
        variables: {
          input: {
            holdingId: holding.id,
            quantityDelta,
          },
        },
      });
      setPatchInputs((prev) => ({ ...prev, [holding.id]: '' }));
      await refetchHoldings();
    } catch (error) {
      console.error('보유 수량 증가 실패:', error);
    } finally {
      setPatchingHoldingId(null);
    }
  };

  const handlePutQuantity = async (holding: Holding) => {
    const rawValue = putInputs[holding.id];
    if (rawValue === undefined || rawValue === '') return;

    const quantity = Number(rawValue);
    if (Number.isNaN(quantity) || quantity < 0) {
      return;
    }

    setPuttingHoldingId(holding.id);
    try {
      await putHoldingQuantity({
        variables: {
          input: {
            holdingId: holding.id,
            quantity,
          },
        },
      });
      setPutInputs((prev) => ({ ...prev, [holding.id]: '' }));
      await refetchHoldings();
    } catch (error) {
      console.error('보유 수량 설정 실패:', error);
    } finally {
      setPuttingHoldingId(null);
    }
  };

  const handleSyncPrice = async (holding: Holding) => {
    setSyncingHoldingId(holding.id);
    try {
      await syncHoldingPrice({
        variables: {
          input: {
            holdingId: holding.id,
          },
        },
      });
      await refetchHoldings();
    } catch (error) {
      console.error('현재가 동기화 실패:', error);
    } finally {
      setSyncingHoldingId(null);
    }
  };

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
            <Th>수동 조정</Th>
            <Th>관리</Th>
          </tr>
        </thead>
        <tbody>
          {holdingsData?.brokerageHoldings?.map((holding: Holding) => {
            const tags = getTagsForHolding(holding.symbol);
            const isPatching =
              patchLoading && patchingHoldingId === holding.id;
            const isPutting = putLoading && puttingHoldingId === holding.id;
            const isSyncing = syncLoading && syncingHoldingId === holding.id;
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
                  <ManualControls>
                    <ControlRow>
                      <NumberInput
                        type="number"
                        min="0"
                        placeholder="증가 수량"
                        value={patchInputs[holding.id] ?? ''}
                        onChange={(event) =>
                          handlePatchInputChange(holding.id, event.target.value)
                        }
                      />
                      <Button
                        variant="primary"
                        onClick={() => handlePatchQuantity(holding)}
                        disabled={isPatching}
                      >
                        수량 추가
                      </Button>
                    </ControlRow>
                    <ControlRow>
                      <NumberInput
                        type="number"
                        min="0"
                        placeholder="설정 수량"
                        value={putInputs[holding.id] ?? ''}
                        onChange={(event) =>
                          handlePutInputChange(holding.id, event.target.value)
                        }
                      />
                      <Button
                        onClick={() => handlePutQuantity(holding)}
                        disabled={isPutting}
                      >
                        수량 설정
                      </Button>
                    </ControlRow>
                    <ControlRow>
                      <Button
                        onClick={() => handleSyncPrice(holding)}
                        disabled={isSyncing}
                      >
                        현재가 동기화
                      </Button>
                    </ControlRow>
                  </ManualControls>
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
