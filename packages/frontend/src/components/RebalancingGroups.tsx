import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  useGetRebalancingGroupsQuery,
  useGetRebalancingAnalysisQuery,
  useGetInvestmentRecommendationQuery,
  useCreateRebalancingGroupMutation,
  useSetTargetAllocationsMutation,
  useAddTagsToRebalancingGroupMutation,
  useRemoveTagsFromRebalancingGroupMutation,
  useRenameRebalancingGroupMutation,
  useDeleteRebalancingGroupMutation,
  useGetTagsQuery,
} from '../graphql/__generated__';
import { Button, ButtonGroup } from './ui/Button';
import { Card, CardHeader, CardTitle } from './ui/Card';
import { Form, Field, FieldLabel, TextInput } from './ui/FormControls';
import {
  Grid as LayoutGrid,
  Section,
  SectionDescription,
  SectionHeader,
  SectionTitle,
} from './ui/Layout';

const FormGroup = Field;
const Label = FieldLabel;
const Input = TextInput;

const GroupCard = styled(Card)`
  position: relative;
`;

const AllocationGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${(props) => props.theme.spacing.lg};
  margin-top: ${(props) => props.theme.spacing.lg};
`;

const ChartContainer = styled.div`
  height: 300px;
  margin: ${(props) => props.theme.spacing.lg} 0;
`;

const ChartToggle = styled.div`
  display: inline-flex;
  gap: ${(props) => props.theme.spacing.xs};
  margin-left: ${(props) => props.theme.spacing.md};
`;

const ToggleButton = styled.button<{ $active: boolean }>`
  padding: ${(props) => props.theme.spacing.xs}
    ${(props) => props.theme.spacing.sm};
  border-radius: ${(props) => props.theme.borderRadius.sm};
  border: 1px solid
    ${(props) =>
      props.$active ? props.theme.colors.primary : props.theme.colors.border};
  background-color: ${(props) =>
    props.$active ? props.theme.colors.primary : 'transparent'};
  color: ${(props) => (props.$active ? 'white' : props.theme.colors.text)};
  font-size: ${(props) => props.theme.typography.fontSize.sm};
  cursor: pointer;
`;

const AllocationTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: ${(props) => props.theme.spacing.md};
`;

const Th = styled.th`
  background-color: ${(props) => props.theme.colors.light};
  padding: ${(props) => props.theme.spacing.sm};
  text-align: left;
  border: 1px solid ${(props) => props.theme.colors.border};
`;

const Td = styled.td`
  padding: ${(props) => props.theme.spacing.sm};
  border: 1px solid ${(props) => props.theme.colors.border};
`;

const TagColor = styled.div<{ color: string }>`
  width: 16px;
  height: 16px;
  background-color: ${(props) => props.color};
  border-radius: 50%;
  display: inline-block;
  margin-right: ${(props) => props.theme.spacing.xs};
`;

const RADIAN = Math.PI / 180;
const ZERO_DECIMAL_CURRENCIES = new Set(['KRW', 'JPY']);

const getReadableTextColor = (hexColor: string) => {
  const fallback = '#1f2933';
  if (!hexColor) {
    return fallback;
  }

  const normalized = hexColor.replace('#', '');
  if (normalized.length !== 6) {
    return fallback;
  }

  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);

  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
    return fallback;
  }

  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.6 ? fallback : '#ffffff';
};

interface RebalancingGroup {
  id: string;
  name: string;
  description: string | null;
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
  baseCurrency: string;
}

interface RebalancingAnalysis {
  groupId: string;
  groupName: string;
  totalValue: number;
  baseCurrency: string;
  lastUpdated: string;
  allocations: TagAllocation[];
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
  const [targetAllocations, setTargetAllocations] = useState<{
    [key: string]: number;
  }>({});
  const [chartMode, setChartMode] = useState<'percentage' | 'value'>(
    'percentage',
  );
  const [tagManagement, setTagManagement] = useState<{
    groupId: string | null;
    selectedTagIds: string[];
  }>({ groupId: null, selectedTagIds: [] });
  const [renameState, setRenameState] = useState<{
    groupId: string | null;
    name: string;
  }>({ groupId: null, name: '' });

  const {
    data: groupsData,
    loading: groupsLoading,
    refetch: refetchGroups,
  } = useGetRebalancingGroupsQuery();
  const { data: tagsData } = useGetTagsQuery();
  const { data: analysisData, refetch: refetchAnalysis } =
    useGetRebalancingAnalysisQuery({
      variables: { groupId: selectedGroup as string },
      skip: !selectedGroup,
    });
  const { data: recommendationData } = useGetInvestmentRecommendationQuery({
    variables: {
      input: { groupId: selectedGroup as string, investmentAmount },
    },
    skip: !selectedGroup,
  });

  const [createGroup] = useCreateRebalancingGroupMutation();
  const [setTargets] = useSetTargetAllocationsMutation();
  const [addTagsToGroup] = useAddTagsToRebalancingGroupMutation();
  const [removeTagsFromGroup] = useRemoveTagsFromRebalancingGroupMutation();
  const [renameGroupMutation] = useRenameRebalancingGroupMutation();
  const [deleteGroupMutation] = useDeleteRebalancingGroupMutation();

  const analysis = analysisData?.rebalancingAnalysis as
    | RebalancingAnalysis
    | undefined;
  const recommendations =
    (recommendationData?.investmentRecommendation as
      | InvestmentRecommendation[]
      | undefined) ?? [];
  const baseCurrency =
    analysis?.baseCurrency ?? recommendations[0]?.baseCurrency ?? 'USD';
  const isZeroDecimalCurrency = ZERO_DECIMAL_CURRENCIES.has(baseCurrency);
  const currencyFormatter = useMemo(() => {
    const fractionDigits = isZeroDecimalCurrency ? 0 : 2;
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: baseCurrency,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
  }, [baseCurrency, isZeroDecimalCurrency]);
  const currencySymbol = useMemo(() => {
    try {
      const part = currencyFormatter
        .formatToParts(0)
        .find((item) => item.type === 'currency');
      return part?.value ?? baseCurrency;
    } catch {
      return baseCurrency;
    }
  }, [currencyFormatter, baseCurrency]);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createGroup({
        variables: { input: formData },
      });
      setFormData({ name: '', description: '', tagIds: [] });
      setShowForm(false);
      refetchGroups();
    } catch (err) {
      console.error('그룹 생성 실패:', err);
    }
  };

  const handleSetTargets = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) return;

    const targets = Object.entries(targetAllocations).map(
      ([tagId, percentage]) => ({
        tagId,
        targetPercentage: percentage,
      }),
    );

    const totalPercentage = targets.reduce(
      (sum, target) => sum + target.targetPercentage,
      0,
    );
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
    } catch (err) {
      console.error('목표 비율 설정 실패:', err);
    }
  };

  const handleTagToggle = (tagId: string) => {
    setFormData((prev) => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId)
        ? prev.tagIds.filter((id) => id !== tagId)
        : [...prev.tagIds, tagId],
    }));
  };

  const handleToggleAnalysis = (group: RebalancingGroup) => {
    setSelectedGroup((prev) => (prev === group.id ? null : group.id));
    setShowTargetForm(false);
    setTargetAllocations({});
  };

  const handleStartTagManagement = (group: RebalancingGroup) => {
    if (tagManagement.groupId === group.id) {
      setTagManagement({ groupId: null, selectedTagIds: [] });
      return;
    }
    setTagManagement({ groupId: group.id, selectedTagIds: [...group.tagIds] });
  };

  const handleManagedTagToggle = (tagId: string) => {
    setTagManagement((prev) => {
      const selected = prev.selectedTagIds.includes(tagId)
        ? prev.selectedTagIds.filter((id) => id !== tagId)
        : [...prev.selectedTagIds, tagId];
      return {
        ...prev,
        selectedTagIds: selected,
      };
    });
  };

  const handleSaveManagedTags = async () => {
    if (!tagManagement.groupId) {
      return;
    }

    const group = groupsData?.rebalancingGroups?.find(
      (g: RebalancingGroup) => g.id === tagManagement.groupId,
    );
    if (!group) {
      return;
    }

    const selectedSet = new Set(tagManagement.selectedTagIds);
    const originalSet = new Set(group.tagIds);

    const tagsToAdd = Array.from(selectedSet).filter(
      (tagId) => !originalSet.has(tagId),
    );
    const tagsToRemove = group.tagIds.filter(
      (tagId) => !selectedSet.has(tagId),
    );

    const operations: Promise<unknown>[] = [];
    if (tagsToAdd.length > 0) {
      operations.push(
        addTagsToGroup({
          variables: {
            input: {
              groupId: group.id,
              tagIds: tagsToAdd,
            },
          },
        }),
      );
    }
    if (tagsToRemove.length > 0) {
      operations.push(
        removeTagsFromGroup({
          variables: {
            input: {
              groupId: group.id,
              tagIds: tagsToRemove,
            },
          },
        }),
      );
    }

    if (operations.length === 0) {
      setTagManagement({ groupId: null, selectedTagIds: [] });
      return;
    }

    try {
      await Promise.all(operations);
      setTagManagement({ groupId: null, selectedTagIds: [] });
      refetchGroups();
      if (selectedGroup === group.id) {
        refetchAnalysis();
        setTargetAllocations((prev) => {
          const next = { ...prev };
          for (const removed of tagsToRemove) {
            delete next[removed];
          }
          return next;
        });
      }
    } catch (err) {
      console.error('태그 관리 실패:', err);
    }
  };

  const handleRename = (group: RebalancingGroup) => {
    if (renameState.groupId === group.id) {
      setRenameState({ groupId: null, name: '' });
      return;
    }
    setRenameState({ groupId: group.id, name: group.name });
  };

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameState.groupId) {
      return;
    }

    try {
      await renameGroupMutation({
        variables: {
          input: {
            groupId: renameState.groupId,
            name: renameState.name,
          },
        },
      });
      setRenameState({ groupId: null, name: '' });
      refetchGroups();
    } catch (err) {
      console.error('그룹 이름 변경 실패:', err);
    }
  };

  const handleDeleteGroup = async (group: RebalancingGroup) => {
    const confirmed = window.confirm(
      `${group.name} 그룹을 정말 삭제하시겠습니까? 삭제하면 복구할 수 없습니다.`,
    );
    if (!confirmed) {
      return;
    }

    try {
      await deleteGroupMutation({ variables: { id: group.id } });
      if (selectedGroup === group.id) {
        setSelectedGroup(null);
        setShowTargetForm(false);
        setTargetAllocations({});
      }
      if (tagManagement.groupId === group.id) {
        setTagManagement({ groupId: null, selectedTagIds: [] });
      }
      if (renameState.groupId === group.id) {
        setRenameState({ groupId: null, name: '' });
      }
      refetchGroups();
    } catch (err) {
      console.error('그룹 삭제 실패:', err);
    }
  };

  const selectedGroupData = groupsData?.rebalancingGroups?.find(
    (g: RebalancingGroup) => g.id === selectedGroup,
  );

  const chartData = useMemo(() => {
    if (!analysis) {
      return [] as Array<
        TagAllocation & { pieValue: number; pieLabel: string }
      >;
    }

    return analysis.allocations.map((item) => {
      const pieValue =
        chartMode === 'percentage' ? item.currentPercentage : item.currentValue;
      const pieLabel =
        chartMode === 'percentage'
          ? `${item.tagName} ${item.currentPercentage.toFixed(1)}%`
          : `${item.tagName} ${currencyFormatter.format(item.currentValue)}`;

      return {
        ...item,
        pieValue,
        pieLabel,
      };
    });
  }, [analysis, chartMode, currencyFormatter]);

  const renderPieLabel = useCallback(
    ({
      cx,
      cy,
      midAngle,
      innerRadius,
      outerRadius,
      payload,
    }: {
      cx: number;
      cy: number;
      midAngle: number;
      innerRadius: number;
      outerRadius: number;
      payload: TagAllocation;
    }) => {
      if (!payload) {
        return null;
      }

      const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
      const x = cx + radius * Math.cos(-midAngle * RADIAN);
      const y = cy + radius * Math.sin(-midAngle * RADIAN);
      const textColor = getReadableTextColor(payload.tagColor);
      const valueText =
        chartMode === 'percentage'
          ? `${payload.currentPercentage.toFixed(1)}%`
          : currencyFormatter.format(payload.currentValue);

      return (
        <text
          x={x}
          y={y}
          fill={textColor}
          fontSize={12}
          textAnchor="middle"
          dominantBaseline="central"
        >
          <tspan x={x} dy="-0.2em">
            {payload.tagName}
          </tspan>
          <tspan x={x} dy="1.2em">
            {valueText}
          </tspan>
        </text>
      );
    },
    [chartMode, currencyFormatter],
  );

  useEffect(() => {
    if (showTargetForm) {
      return;
    }

    if (!selectedGroupData) {
      setTargetAllocations((prev) => {
        if (Object.keys(prev).length === 0) {
          return prev;
        }
        return {};
      });
      return;
    }

    const allocations = analysis?.allocations ?? [];
    const allocationMap = new Map<string, number>();
    for (const allocation of allocations) {
      allocationMap.set(allocation.tagId, allocation.targetPercentage);
    }

    setTargetAllocations((prev) => {
      const next: Record<string, number> = {};
      for (const tagId of selectedGroupData.tagIds) {
        const existing = allocationMap.get(tagId);
        next[tagId] = typeof existing === 'number' ? existing : 0;
      }

      const prevKeys = Object.keys(prev);
      const nextKeys = Object.keys(next);
      const unchanged =
        prevKeys.length === nextKeys.length &&
        nextKeys.every(
          (key) => Math.abs((prev[key] ?? 0) - next[key]) < 0.0001,
        );

      return unchanged ? prev : next;
    });
  }, [showTargetForm, selectedGroupData, analysis?.allocations]);

  if (groupsLoading) return <div>로딩 중...</div>;

  return (
    <Section>
      <SectionHeader>
        <SectionTitle>리밸런싱 그룹</SectionTitle>
        <SectionDescription>
          태그별로 자산을 그룹화하여 리밸런싱 전략을 관리합니다.
        </SectionDescription>
      </SectionHeader>

      <Button variant="primary" onClick={() => setShowForm(!showForm)}>
        {showForm ? '취소' : '그룹 추가'}
      </Button>

      {showForm && (
        <Card as="section">
          <CardHeader>
            <CardTitle>새 리밸런싱 그룹 추가</CardTitle>
          </CardHeader>
          <Form onSubmit={handleCreateGroup}>
            <Field>
              <FieldLabel htmlFor="group-name">그룹 이름</FieldLabel>
              <TextInput
                id="group-name"
                value={formData.name}
                onChange={(event) =>
                  setFormData({ ...formData, name: event.target.value })
                }
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="group-description">설명</FieldLabel>
              <TextInput
                id="group-description"
                value={formData.description}
                onChange={(event) =>
                  setFormData({ ...formData, description: event.target.value })
                }
              />
            </Field>

            <Field>
              <FieldLabel>포함할 태그</FieldLabel>
              <div>
                {tagsData?.tags?.map((tag: Tag) => (
                  <label
                    key={tag.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '8px',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.tagIds.includes(tag.id)}
                      onChange={() => handleTagToggle(tag.id)}
                    />
                    <TagColor color={tag.color} />
                    <span>{tag.name}</span>
                  </label>
                ))}
              </div>
            </Field>

            <ButtonGroup>
              <Button type="submit" variant="primary">
                그룹 추가
              </Button>
              <Button type="button" onClick={() => setShowForm(false)}>
                취소
              </Button>
            </ButtonGroup>
          </Form>
        </Card>
      )}

      <LayoutGrid minWidth="400px">
        {groupsData?.rebalancingGroups?.map((group: RebalancingGroup) => (
          <GroupCard key={group.id}>
            <h3>{group.name}</h3>
            {group.description && <p>{group.description}</p>}

            <div style={{ marginBottom: '16px' }}>
              <strong>포함 태그:</strong>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  marginTop: '4px',
                }}
              >
                {group.tagIds.map((tagId) => {
                  const tag = tagsData?.tags?.find((t: Tag) => t.id === tagId);
                  return tag ? (
                    <div
                      key={tagId}
                      style={{ display: 'flex', alignItems: 'center' }}
                    >
                      <TagColor color={tag.color} />
                      <span style={{ fontSize: '14px' }}>{tag.name}</span>
                    </div>
                  ) : null;
                })}
              </div>
            </div>

            <div>
              <Button onClick={() => handleToggleAnalysis(group)}>
                분석 보기
              </Button>
              <Button onClick={() => handleStartTagManagement(group)}>
                태그 관리
              </Button>
              <Button onClick={() => handleRename(group)}>이름 변경</Button>
              <Button
                type="button"
                variant="danger"
                onClick={() => handleDeleteGroup(group)}
              >
                그룹 삭제
              </Button>
            </div>

            {tagManagement.groupId === group.id && (
              <Card style={{ marginTop: '16px', backgroundColor: '#f8f9fa' }}>
                <h4>태그 관리</h4>
                <Form
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleSaveManagedTags();
                  }}
                >
                  <FormGroup>
                    <Label>포함할 태그 선택</Label>
                    <div
                      style={{
                        display: 'grid',
                        gap: '8px',
                        maxHeight: '200px',
                        overflowY: 'auto',
                      }}
                    >
                      {tagsData?.tags?.map((tag: Tag) => (
                        <label
                          key={tag.id}
                          style={{ display: 'flex', gap: '8px' }}
                        >
                          <input
                            type="checkbox"
                            checked={tagManagement.selectedTagIds.includes(
                              tag.id,
                            )}
                            onChange={() => handleManagedTagToggle(tag.id)}
                          />
                          {tag.name}
                        </label>
                      ))}
                    </div>
                  </FormGroup>
                  <div>
                    <Button type="submit" variant="primary">
                      태그 변경 저장
                    </Button>
                    <Button
                      type="button"
                      onClick={() =>
                        setTagManagement({ groupId: null, selectedTagIds: [] })
                      }
                    >
                      취소
                    </Button>
                  </div>
                </Form>
              </Card>
            )}

            {renameState.groupId === group.id && (
              <Card style={{ marginTop: '16px', backgroundColor: '#fff8e1' }}>
                <h4>그룹 이름 변경</h4>
                <Form onSubmit={handleRenameSubmit}>
                  <FormGroup>
                    <Label>새로운 이름</Label>
                    <Input
                      type="text"
                      value={renameState.name}
                      onChange={(event) =>
                        setRenameState((prev) => ({
                          ...prev,
                          name: event.target.value,
                        }))
                      }
                      required
                    />
                  </FormGroup>
                  <div>
                    <Button type="submit" variant="primary">
                      이름 저장
                    </Button>
                    <Button
                      type="button"
                      onClick={() =>
                        setRenameState({ groupId: null, name: '' })
                      }
                    >
                      취소
                    </Button>
                  </div>
                </Form>
              </Card>
            )}
          </GroupCard>
        ))}
      </LayoutGrid>

      {selectedGroup && selectedGroupData && (
        <Card>
          <h3>{selectedGroupData.name} 분석</h3>
          {analysis && (
            <p style={{ marginTop: '8px', color: '#6c757d' }}>
              총 평가 금액: {currencyFormatter.format(analysis.totalValue)}
            </p>
          )}

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
                        onChange={(e) =>
                          setTargetAllocations((prev) => ({
                            ...prev,
                            [tagId]: parseFloat(e.target.value) || 0,
                          }))
                        }
                      />
                    </FormGroup>
                  ) : null;
                })}

                <div>
                  <Button type="submit" variant="primary">
                    목표 비율 적용
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setShowTargetForm(false)}
                  >
                    취소
                  </Button>
                </div>
              </Form>
            </Card>
          )}

          {analysis && (
            <AllocationGrid>
              <div>
                <h4>현재 vs 목표 자산 배분</h4>
                <ChartContainer>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analysis.allocations.map((item) => ({
                        ...item,
                        barCurrent:
                          chartMode === 'percentage'
                            ? item.currentPercentage
                            : item.currentValue,
                        barTarget:
                          chartMode === 'percentage'
                            ? item.targetPercentage
                            : (item.targetPercentage / 100) *
                              analysis.totalValue,
                      }))}
                      margin={{ top: 16, right: 24, left: 56, bottom: 16 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="tagName" />
                      <YAxis
                        tickFormatter={(value) =>
                          chartMode === 'percentage'
                            ? `${value}%`
                            : currencyFormatter.format(Number(value))
                        }
                      />
                      <Tooltip
                        formatter={(value: number) =>
                          chartMode === 'percentage'
                            ? [`${value.toFixed(1)}%`, '']
                            : [currencyFormatter.format(value), '']
                        }
                      />
                      <Legend />
                      <Bar
                        dataKey="barCurrent"
                        fill="#8884d8"
                        name={
                          chartMode === 'percentage'
                            ? '현재 비율'
                            : `현재 금액 (${currencySymbol})`
                        }
                      />
                      <Bar
                        dataKey="barTarget"
                        fill="#82ca9d"
                        name={
                          chartMode === 'percentage'
                            ? '목표 비율'
                            : `목표 금액 (${currencySymbol})`
                        }
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>

              <div>
                <h4>
                  현재 자산 배분
                  <ChartToggle>
                    <ToggleButton
                      type="button"
                      $active={chartMode === 'percentage'}
                      aria-pressed={chartMode === 'percentage'}
                      onClick={() => setChartMode('percentage')}
                    >
                      비율
                    </ToggleButton>
                    <ToggleButton
                      type="button"
                      $active={chartMode === 'value'}
                      aria-pressed={chartMode === 'value'}
                      onClick={() => setChartMode('value')}
                    >
                      금액 ({currencySymbol})
                    </ToggleButton>
                  </ChartToggle>
                </h4>
                <ChartContainer>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart
                      margin={{ top: 16, right: 32, bottom: 16, left: 32 }}
                    >
                      <Pie
                        data={chartData as unknown as Record<string, unknown>[]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderPieLabel as unknown as undefined}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="pieValue"
                        paddingAngle={1}
                      >
                        {chartData.map(
                          (entry: TagAllocation, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.tagColor} />
                          ),
                        )}
                      </Pie>
                      <Tooltip
                        formatter={(value: number, _name: string, payload) =>
                          chartMode === 'percentage'
                            ? [`${value.toFixed(2)}%`, payload.payload.tagName]
                            : [
                                currencyFormatter.format(value),
                                payload.payload.tagName,
                              ]
                        }
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </AllocationGrid>
          )}

          <div style={{ marginTop: '24px' }}>
            <h4>투자 추천</h4>
            <FormGroup>
              <Label>투자 예정 금액 ({currencySymbol})</Label>
              <Input
                type="number"
                value={investmentAmount}
                onChange={(e) =>
                  setInvestmentAmount(parseFloat(e.target.value) || 0)
                }
                min="0"
                step={isZeroDecimalCurrency ? 1000 : 100}
              />
            </FormGroup>

            {recommendations.length > 0 && (
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
                  {recommendations.map((rec: InvestmentRecommendation) => (
                    <tr key={rec.tagId}>
                      <Td>
                        <TagColor
                          color={
                            tagsData?.tags?.find((t: Tag) => t.id === rec.tagId)
                              ?.color || '#ccc'
                          }
                        />
                        {rec.tagName}
                      </Td>
                      <Td>{currencyFormatter.format(rec.recommendedAmount)}</Td>
                      <Td>{rec.recommendedPercentage.toFixed(1)}%</Td>
                      <Td>{rec.suggestedSymbols.join(', ') || '-'}</Td>
                    </tr>
                  ))}
                </tbody>
              </AllocationTable>
            )}
          </div>
        </Card>
      )}
    </Section>
  );
};
