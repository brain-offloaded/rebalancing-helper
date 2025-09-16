import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import styled from 'styled-components';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { GET_REBALANCING_GROUPS, GET_REBALANCING_ANALYSIS, GET_INVESTMENT_RECOMMENDATION, CREATE_REBALANCING_GROUP, SET_TARGET_ALLOCATIONS } from '../graphql/rebalancing';
import { GET_TAGS } from '../graphql/tags';

const Container = styled.div`
  padding: ${props => props.theme.spacing.lg};
`;

const Card = styled.div`
  background: white;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.md};
  box-shadow: ${props => props.theme.shadows.sm};
`;

const Button = styled.button<{ variant?: 'primary' | 'danger' | 'secondary' }>`
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  font-size: ${props => props.theme.typography.fontSize.sm};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  border: none;
  border-radius: ${props => props.theme.borderRadius.sm};
  cursor: pointer;
  transition: all 0.2s ease;
  margin-right: ${props => props.theme.spacing.sm};

  ${props => {
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
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const Input = styled.input`
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: ${props => props.theme.typography.fontSize.md};

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }
`;

const GroupGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: ${props => props.theme.spacing.md};
`;

const GroupCard = styled(Card)`
  position: relative;
`;

const AllocationGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${props => props.theme.spacing.lg};
  margin-top: ${props => props.theme.spacing.lg};
`;

const ChartContainer = styled.div`
  height: 300px;
  margin: ${props => props.theme.spacing.lg} 0;
`;

const AllocationTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: ${props => props.theme.spacing.md};
`;

const Th = styled.th`
  background-color: ${props => props.theme.colors.light};
  padding: ${props => props.theme.spacing.sm};
  text-align: left;
  border: 1px solid ${props => props.theme.colors.border};
`;

const Td = styled.td`
  padding: ${props => props.theme.spacing.sm};
  border: 1px solid ${props => props.theme.colors.border};
`;

const TagColor = styled.div<{ color: string }>`
  width: 16px;
  height: 16px;
  background-color: ${props => props.color};
  border-radius: 50%;
  display: inline-block;
  margin-right: ${props => props.theme.spacing.xs};
`;

interface RebalancingGroup {
  id: string;
  name: string;
  description?: string;
  tagIds: string[];
  createdAt: string;
  updatedAt: string;
}

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface TagAllocation {
  tagId: string;
  tagName: string;
  tagColor: string;
  currentValue: number;
  currentPercentage: number;
  targetPercentage: number;
  difference: number;
}

interface InvestmentRecommendation {
  tagId: string;
  tagName: string;
  recommendedAmount: number;
  recommendedPercentage: number;
  suggestedSymbols: string[];
}

export const RebalancingGroups: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [showTargetForm, setShowTargetForm] = useState(false);
  const [investmentAmount, setInvestmentAmount] = useState<number>(1000);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tagIds: [] as string[],
  });
  const [targetAllocations, setTargetAllocations] = useState<{ [key: string]: number }>({});

  const { data: groupsData, loading: groupsLoading, refetch: refetchGroups } =
    useQuery(GET_REBALANCING_GROUPS);
  const { data: tagsData } = useQuery<{ tags: Tag[] }>(GET_TAGS);
  const { data: analysisData, refetch: refetchAnalysis } = useQuery(GET_REBALANCING_ANALYSIS, {
    variables: { groupId: selectedGroup },
    skip: !selectedGroup,
  });
  const { data: recommendationData } = useQuery<{
    investmentRecommendation: InvestmentRecommendation[];
  }>(GET_INVESTMENT_RECOMMENDATION, {
    variables: { input: { groupId: selectedGroup, investmentAmount } },
    skip: !selectedGroup,
  });

  const [createGroup] = useMutation(CREATE_REBALANCING_GROUP);
  const [setTargets] = useMutation(SET_TARGET_ALLOCATIONS);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createGroup({
        variables: { input: formData },
      });
      setFormData({ name: '', description: '', tagIds: [] });
      setShowForm(false);
      refetchGroups();
    } catch (error) {
      console.error('그룹 생성 실패:', error);
    }
  };

  const handleSetTargets = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) return;

    const targets = Object.entries(targetAllocations).map(([tagId, percentage]) => ({
      tagId,
      targetPercentage: percentage,
    }));

    const totalPercentage = targets.reduce((sum, target) => sum + target.targetPercentage, 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      alert('목표 비율의 합이 100%가 되어야 합니다.');
      return;
    }

    try {
      await setTargets({
        variables: {
          input: {
            groupId: selectedGroup,
            targets,
          },
        },
      });
      setShowTargetForm(false);
      refetchAnalysis();
    } catch (error) {
      console.error('목표 비율 설정 실패:', error);
    }
  };

  const handleTagToggle = (tagId: string) => {
    setFormData(prev => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId)
        ? prev.tagIds.filter(id => id !== tagId)
        : [...prev.tagIds, tagId],
    }));
  };

  const selectedGroupData = groupsData?.rebalancingGroups?.find((g: RebalancingGroup) => g.id === selectedGroup);

  if (groupsLoading) return <div>로딩 중...</div>;

  return (
    <Container>
      <h2>리밸런싱 그룹</h2>
      <p>태그별로 자산을 그룹화하여 리밸런싱 전략을 관리합니다.</p>
      
      <Button variant="primary" onClick={() => setShowForm(!showForm)}>
        {showForm ? '취소' : '그룹 추가'}
      </Button>

      {showForm && (
        <Card>
          <h3>새 리밸런싱 그룹 추가</h3>
          <Form onSubmit={handleCreateGroup}>
            <FormGroup>
              <Label>그룹 이름</Label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </FormGroup>

            <FormGroup>
              <Label>설명</Label>
              <Input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </FormGroup>

            <FormGroup>
              <Label>포함할 태그</Label>
              <div>
                {tagsData?.tags?.map((tag: Tag) => (
                  <div key={tag.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                    <input
                      type="checkbox"
                      checked={formData.tagIds.includes(tag.id)}
                      onChange={() => handleTagToggle(tag.id)}
                      style={{ marginRight: '8px' }}
                    />
                    <TagColor color={tag.color} />
                    <span>{tag.name}</span>
                  </div>
                ))}
              </div>
            </FormGroup>

            <div>
              <Button type="submit" variant="primary">그룹 추가</Button>
              <Button type="button" onClick={() => setShowForm(false)}>취소</Button>
            </div>
          </Form>
        </Card>
      )}

      <GroupGrid>
        {groupsData?.rebalancingGroups?.map((group: RebalancingGroup) => (
          <GroupCard key={group.id}>
            <h3>{group.name}</h3>
            {group.description && <p>{group.description}</p>}
            
            <div style={{ marginBottom: '16px' }}>
              <strong>포함 태그:</strong>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                {group.tagIds.map((tagId) => {
                  const tag = tagsData?.tags?.find((t: Tag) => t.id === tagId);
                  return tag ? (
                    <div key={tagId} style={{ display: 'flex', alignItems: 'center' }}>
                      <TagColor color={tag.color} />
                      <span style={{ fontSize: '14px' }}>{tag.name}</span>
                    </div>
                  ) : null;
                })}
              </div>
            </div>

            <div>
              <Button onClick={() => setSelectedGroup(group.id)}>분석 보기</Button>
            </div>
          </GroupCard>
        ))}
      </GroupGrid>

      {selectedGroup && selectedGroupData && (
        <Card>
          <h3>{selectedGroupData.name} 분석</h3>
          
          <div>
            <Button onClick={() => setShowTargetForm(!showTargetForm)}>
              목표 비율 설정
            </Button>
          </div>

          {showTargetForm && (
            <Card style={{ margin: '16px 0', backgroundColor: '#f8f9fa' }}>
              <h4>목표 비율 설정</h4>
              <Form onSubmit={handleSetTargets}>
                {selectedGroupData.tagIds.map((tagId) => {
                  const tag = tagsData?.tags?.find((t: Tag) => t.id === tagId);
                  return tag ? (
                    <FormGroup key={tagId}>
                      <Label>
                        <TagColor color={tag.color} />
                        {tag.name} 목표 비율 (%)
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={targetAllocations[tagId] || 0}
                        onChange={(e) => setTargetAllocations(prev => ({
                          ...prev,
                          [tagId]: parseFloat(e.target.value) || 0,
                        }))}
                      />
                    </FormGroup>
                  ) : null;
                })}
                
                <div>
                  <Button type="submit" variant="primary">목표 비율 적용</Button>
                  <Button type="button" onClick={() => setShowTargetForm(false)}>취소</Button>
                </div>
              </Form>
            </Card>
          )}

          {analysisData?.rebalancingAnalysis && (
            <AllocationGrid>
              <div>
                <h4>현재 vs 목표 자산 배분</h4>
                <ChartContainer>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analysisData.rebalancingAnalysis.allocations}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="tagName" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="currentPercentage" fill="#8884d8" name="현재 비율" />
                      <Bar dataKey="targetPercentage" fill="#82ca9d" name="목표 비율" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>

              <div>
                <h4>현재 자산 배분</h4>
                <ChartContainer>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analysisData.rebalancingAnalysis.allocations}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ tagName, currentPercentage }) => `${tagName} ${currentPercentage.toFixed(1)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="currentValue"
                      >
                        {analysisData.rebalancingAnalysis.allocations.map((entry: TagAllocation, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.tagColor} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </AllocationGrid>
          )}

          <div style={{ marginTop: '24px' }}>
            <h4>투자 추천</h4>
            <FormGroup>
              <Label>투자 예정 금액 ($)</Label>
              <Input
                type="number"
                value={investmentAmount}
                onChange={(e) => setInvestmentAmount(parseFloat(e.target.value) || 0)}
                min="0"
                step="100"
              />
            </FormGroup>

            {recommendationData?.investmentRecommendation && (
              <AllocationTable>
                <thead>
                  <tr>
                    <Th>태그</Th>
                    <Th>추천 투자액</Th>
                    <Th>투자 비율</Th>
                    <Th>추천 종목</Th>
                  </tr>
                </thead>
                <tbody>
                  {recommendationData.investmentRecommendation.map(
                    (rec: InvestmentRecommendation) => (
                    <tr key={rec.tagId}>
                      <Td>
                        <TagColor color={tagsData?.tags?.find((t: Tag) => t.id === rec.tagId)?.color || '#ccc'} />
                        {rec.tagName}
                      </Td>
                      <Td>${rec.recommendedAmount.toFixed(2)}</Td>
                      <Td>{rec.recommendedPercentage.toFixed(1)}%</Td>
                      <Td>{rec.suggestedSymbols.join(', ') || '-'}</Td>
                    </tr>
                    ),
                  )}
                </tbody>
              </AllocationTable>
            )}
          </div>
        </Card>
      )}
    </Container>
  );
};