import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import styled from 'styled-components';
import { GET_BROKERAGE_HOLDINGS } from '../graphql/brokerage';
import { GET_TAGS } from '../graphql/tags';
import { GET_TAGS_FOR_HOLDING, SET_HOLDING_TAGS } from '../graphql/holdings';

const Container = styled.div`
  padding: ${props => props.theme.spacing.lg};
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: ${props => props.theme.spacing.md};
  background: white;
  border-radius: ${props => props.theme.borderRadius.md};
  overflow: hidden;
  box-shadow: ${props => props.theme.shadows.sm};
`;

const Th = styled.th`
  background-color: ${props => props.theme.colors.primary};
  color: white;
  padding: ${props => props.theme.spacing.md};
  text-align: left;
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
`;

const Td = styled.td`
  padding: ${props => props.theme.spacing.md};
  border-bottom: 1px solid ${props => props.theme.colors.border};
`;

const TagContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${props => props.theme.spacing.xs};
  margin-top: ${props => props.theme.spacing.xs};
`;

const Tag = styled.span<{ color: string }>`
  background-color: ${props => props.color};
  color: white;
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: ${props => props.theme.typography.fontSize.xs};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  font-size: ${props => props.theme.typography.fontSize.xs};
  border: none;
  border-radius: ${props => props.theme.borderRadius.sm};
  cursor: pointer;
  margin-left: ${props => props.theme.spacing.xs};

  ${props => props.variant === 'primary' ? `
    background-color: ${props.theme.colors.primary};
    color: white;
  ` : `
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
  padding: ${props => props.theme.spacing.xl};
  border-radius: ${props => props.theme.borderRadius.md};
  max-width: 500px;
  width: 90%;
  max-height: 70vh;
  overflow-y: auto;
`;

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const Checkbox = styled.input`
  margin-right: ${props => props.theme.spacing.sm};
`;

interface Holding {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  currentPrice: number;
  marketValue: number;
  averageCost?: number;
  currency: string;
  accountId: string;
  lastUpdated: string;
}

interface Tag {
  id: string;
  name: string;
  description?: string;
  color: string;
}

export const Holdings: React.FC = () => {
  const [selectedHolding, setSelectedHolding] = useState<string | null>(null);
  const [showTagModal, setShowTagModal] = useState(false);

  const { data: holdingsData, loading: holdingsLoading } = useQuery(GET_BROKERAGE_HOLDINGS);
  const { data: tagsData } = useQuery<{ tags: Tag[] }>(GET_TAGS);
  const { data: holdingTagsData, refetch: refetchHoldingTags } = useQuery<{
    tagsForHolding: string[];
  }>(GET_TAGS_FOR_HOLDING, {
    variables: { holdingSymbol: selectedHolding },
    skip: !selectedHolding,
  });

  const [setHoldingTags] = useMutation(SET_HOLDING_TAGS);

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
    if (symbol !== selectedHolding) {
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
      <p>증권사에서 가져온 보유 종목 목록입니다. 각 종목에 태그를 설정할 수 있습니다.</p>

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
                <Td>{holding.averageCost ? `$${holding.averageCost.toFixed(2)}` : '-'}</Td>
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

      {showTagModal && selectedHolding && (
        <TagModal
          holding={selectedHolding}
          tags={tagsData?.tags || []}
          currentTags={holdingTagsData?.tagsForHolding || []}
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
  currentTags: string[];
  onUpdate: (tagIds: string[]) => void;
  onClose: () => void;
}

const TagModal: React.FC<TagModalProps> = ({ holding, tags, currentTags, onUpdate, onClose }) => {
  const [selectedTags, setSelectedTags] = useState<string[]>(currentTags);

  const handleTagToggle = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
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
          {tags.map((tag) => (
            <CheckboxContainer key={tag.id}>
              <Checkbox
                type="checkbox"
                checked={selectedTags.includes(tag.id)}
                onChange={() => handleTagToggle(tag.id)}
              />
              <Tag color={tag.color}>{tag.name}</Tag>
              {tag.description && <span style={{ marginLeft: '8px', fontSize: '12px', color: '#666' }}>
                {tag.description}
              </span>}
            </CheckboxContainer>
          ))}
        </div>

        <div>
          <Button variant="primary" onClick={handleSubmit}>적용</Button>
          <Button onClick={onClose}>취소</Button>
        </div>
      </ModalContent>
    </Modal>
  );
};