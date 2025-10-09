import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
  useGetTagsQuery,
  useSetTargetAllocationsMutation,
  useUpdateRebalancingGroupMutation,
  useDeleteRebalancingGroupMutation,
} from '../graphql/__generated__';
import { Button, ButtonGroup } from './ui/Button';
import { Form, Field, FieldLabel, TextInput } from './ui/FormControls';
import { Section } from './ui/Layout';
import { Modal } from './ui/Modal';
import {
  HelperText,
  InlineLabel,
  ModalRow,
  ModalSection,
  TagChip,
  TagContainer,
  TagList,
  ValueBadge,
} from './holdings/styles';
import { formatLastUpdated } from './holdings/formatters';

type ChartMode = 'percentage' | 'value';

interface RebalancingGroupManagementModalProps {
  open: boolean;
  groupId: string | null;
  onClose: () => void;
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

const DetailContainer = styled(Section)`
  max-width: 960px;
  margin: 0 auto;
`;

const DetailHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const DetailTitle = styled.h2`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
`;

const DetailSubtitle = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textLight};
`;

const SummaryBadges = styled(ModalRow)`
  flex-wrap: wrap;
`;

const AllocationGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing.lg};
  width: 100%;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

const ChartContainer = styled.div`
  height: 320px;
  margin-top: ${({ theme }) => theme.spacing.md};
`;

const ChartToggle = styled.div`
  display: inline-flex;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-left: ${({ theme }) => theme.spacing.sm};
`;

const ToggleButton = styled.button<{ $active: boolean }>`
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  border: 1px solid
    ${({ $active, theme }) =>
      $active ? theme.colors.primary : theme.colors.border};
  background-color: ${({ $active, theme }) =>
    $active ? theme.colors.primary : 'transparent'};
  color: ${({ $active, theme }) => ($active ? '#ffffff' : theme.colors.text)};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  cursor: pointer;
`;

const AllocationTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: ${({ theme }) => theme.spacing.sm};
`;

const Th = styled.th`
  background-color: ${({ theme }) => theme.colors.light};
  padding: ${({ theme }) => theme.spacing.sm};
  text-align: left;
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const Td = styled.td`
  padding: ${({ theme }) => theme.spacing.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  vertical-align: top;
`;

const TagSelectionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: ${({ theme }) => theme.spacing.sm};
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

export const RebalancingGroupManagementModal: React.FC<
  RebalancingGroupManagementModalProps
> = ({ open, groupId, onClose }) => {
  const {
    data: groupsData,
    loading: groupsLoading,
    refetch: refetchGroups,
  } = useGetRebalancingGroupsQuery({ skip: !open });
  const { data: tagsData } = useGetTagsQuery({ skip: !open });
  const {
    data: analysisData,
    loading: analysisLoading,
    refetch: refetchAnalysis,
  } = useGetRebalancingAnalysisQuery({
    variables: { groupId: groupId ?? '' },
    skip: !open || !groupId,
  });

  const [investmentAmountInput, setInvestmentAmountInput] = useState('1000');
  const investmentAmountValue = useMemo(() => {
    if (investmentAmountInput.trim() === '') {
      return null;
    }

    const parsed = Number(investmentAmountInput);
    return Number.isNaN(parsed) ? null : parsed;
  }, [investmentAmountInput]);

  const shouldSkipRecommendation =
    !open || !groupId || investmentAmountValue === null;

  const { data: recommendationData } = useGetInvestmentRecommendationQuery({
    variables: {
      input: {
        groupId: groupId ?? '',
        investmentAmount: investmentAmountValue ?? 0,
      },
    },
    skip: shouldSkipRecommendation,
  });

  const [setTargetAllocationsMutation, { loading: savingTargets }] =
    useSetTargetAllocationsMutation();
  const [updateGroupMutation, { loading: updatingGroup }] =
    useUpdateRebalancingGroupMutation();
  const [deleteGroupMutation, { loading: deletingGroup }] =
    useDeleteRebalancingGroupMutation();

  const group = useMemo(
    () => groupsData?.rebalancingGroups?.find((item) => item.id === groupId),
    [groupsData?.rebalancingGroups, groupId],
  );

  const analysis = analysisData?.rebalancingAnalysis as
    | RebalancingAnalysis
    | undefined;

  const [recommendations, setRecommendations] = useState<
    InvestmentRecommendation[]
  >([]);
  const previousGroupIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open || !groupId) {
      setRecommendations([]);
      previousGroupIdRef.current = groupId;
      return;
    }

    if (previousGroupIdRef.current !== groupId) {
      previousGroupIdRef.current = groupId;
      setRecommendations([]);
    }

    if (investmentAmountValue === null) {
      return;
    }

    if (recommendationData) {
      const nextRecommendations =
        (recommendationData.investmentRecommendation as
          | InvestmentRecommendation[]
          | undefined) ?? [];
      setRecommendations(nextRecommendations);
    }
  }, [open, groupId, investmentAmountValue, recommendationData]);

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

  const [nameInput, setNameInput] = useState('');
  const [descriptionInput, setDescriptionInput] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [chartMode, setChartMode] = useState<ChartMode>('percentage');
  const [targetAllocations, setTargetAllocations] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    if (!group) {
      return;
    }

    setNameInput((previous) =>
      previous === group.name ? previous : group.name,
    );
    const nextDescription = group.description ?? '';
    setDescriptionInput((previous) =>
      previous === nextDescription ? previous : nextDescription,
    );
    setSelectedTagIds((previous) => {
      const next = group.tagIds ?? [];
      if (
        previous.length === next.length &&
        previous.every((value, index) => value === next[index])
      ) {
        return previous;
      }
      return next;
    });
  }, [group]);

  useEffect(() => {
    if (!analysis) {
      return;
    }

    setTargetAllocations((prev) => {
      const allocationMap = new Map<string, string>();
      for (const allocation of analysis.allocations) {
        allocationMap.set(
          allocation.tagId,
          Number.isFinite(allocation.targetPercentage)
            ? String(allocation.targetPercentage)
            : '0',
        );
      }

      const next: Record<string, string> = {};
      for (const tagId of selectedTagIds) {
        const existing = allocationMap.get(tagId);
        next[tagId] = existing ?? '0';
      }

      const prevKeys = Object.keys(prev);
      const nextKeys = Object.keys(next);
      const unchanged =
        prevKeys.length === nextKeys.length &&
        nextKeys.every((key) => prev[key] === next[key]);

      return unchanged ? prev : next;
    });
  }, [analysis, selectedTagIds]);

  const saveBasicInfo = useCallback(
    async (options?: { showSuccessAlert?: boolean }) => {
      if (!group) {
        return false;
      }

      const showSuccessAlert = options?.showSuccessAlert ?? true;

      try {
        await updateGroupMutation({
          variables: {
            input: {
              id: group.id,
              name: nameInput.trim(),
              description: descriptionInput.trim() || null,
            },
          },
        });
        await refetchGroups();
        if (showSuccessAlert) {
          alert('그룹 정보를 저장했습니다.');
        }
        return true;
      } catch (error) {
        console.error('그룹 정보 저장 실패:', error);
        alert('그룹 정보를 저장하지 못했습니다. 다시 시도해주세요.');
        return false;
      }
    },
    [group, nameInput, descriptionInput, updateGroupMutation, refetchGroups],
  );

  const handleToggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId],
    );
  };

  const saveTags = useCallback(
    async (options?: { showSuccessAlert?: boolean }) => {
      if (!group) {
        return false;
      }

      const showSuccessAlert = options?.showSuccessAlert ?? true;

      try {
        await updateGroupMutation({
          variables: {
            input: {
              id: group.id,
              tagIds: selectedTagIds,
            },
          },
        });
        await Promise.all([refetchGroups(), refetchAnalysis()]);
        if (showSuccessAlert) {
          alert('태그 구성을 저장했습니다.');
        }
        return true;
      } catch (error) {
        console.error('태그 저장 실패:', error);
        alert('태그 구성을 저장하지 못했습니다. 다시 시도해주세요.');
        return false;
      }
    },
    [
      group,
      selectedTagIds,
      updateGroupMutation,
      refetchGroups,
      refetchAnalysis,
    ],
  );

  const saveTargets = useCallback(
    async (options?: { showSuccessAlert?: boolean }) => {
      if (!group) {
        return false;
      }

      const showSuccessAlert = options?.showSuccessAlert ?? true;

      const targets = Object.entries(targetAllocations).map(
        ([tagId, percentageInput]) => {
          const trimmed =
            typeof percentageInput === 'string' ? percentageInput.trim() : '';
          const parsed = Number(trimmed);

          return {
            tagId,
            targetPercentage: Number.isFinite(parsed) ? parsed : 0,
          };
        },
      );

      const totalPercentage = targets.reduce(
        (sum, target) => sum + target.targetPercentage,
        0,
      );

      if (Math.abs(totalPercentage - 100) > 0.01) {
        alert('목표 비율의 합이 100%가 되어야 합니다.');
        return false;
      }

      try {
        await setTargetAllocationsMutation({
          variables: {
            input: {
              groupId: group.id,
              targets,
            },
          },
        });
        await refetchAnalysis();
        if (showSuccessAlert) {
          alert('목표 비율을 저장했습니다.');
        }
        return true;
      } catch (error) {
        console.error('목표 비율 저장 실패:', error);
        alert('목표 비율을 저장하지 못했습니다. 다시 시도해주세요.');
        return false;
      }
    },
    [group, targetAllocations, setTargetAllocationsMutation, refetchAnalysis],
  );

  const handleDeleteGroup = useCallback(async () => {
    if (!group) {
      return;
    }

    const confirmed = window.confirm(
      `${group.name} 그룹을 정말 삭제하시겠습니까? 삭제하면 복구할 수 없습니다.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteGroupMutation({ variables: { id: group.id } });
      await refetchGroups();
      alert('그룹을 삭제했습니다.');
      onClose();
    } catch (error) {
      console.error('그룹 삭제 실패:', error);
      alert('그룹을 삭제하지 못했습니다. 다시 시도해주세요.');
    }
  }, [group, deleteGroupMutation, refetchGroups, onClose]);

  const handleSaveAll = useCallback(async () => {
    if (!group) {
      return;
    }

    const basicResult = await saveBasicInfo({ showSuccessAlert: false });
    const tagsResult = await saveTags({ showSuccessAlert: false });
    const targetsResult = await saveTargets({ showSuccessAlert: false });

    if (basicResult && tagsResult && targetsResult) {
      alert('리밸런싱 그룹 정보를 저장했습니다.');
    }
  }, [group, saveBasicInfo, saveTags, saveTargets]);

  const isSaving = updatingGroup || savingTargets;
  const isDeleting = deletingGroup;

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
          textAnchor={x > cx ? 'start' : 'end'}
          dominantBaseline="central"
          fontSize={12}
        >
          {payload.tagName}
          <tspan x={x} dy={14}>
            {valueText}
          </tspan>
        </text>
      );
    },
    [chartMode, currencyFormatter],
  );

  if (!open || !groupId) {
    return null;
  }

  if (groupsLoading || analysisLoading) {
    return (
      <Modal
        open={open}
        title="리밸런싱 그룹 관리"
        subtitle="데이터를 불러오는 중입니다..."
        onClose={onClose}
      >
        <div>로딩 중...</div>
      </Modal>
    );
  }

  if (!group) {
    return (
      <Modal
        open={open}
        title="선택한 리밸런싱 그룹을 찾을 수 없습니다."
        onClose={onClose}
      >
        <p style={{ margin: 0 }}>
          리밸런싱 그룹 정보를 불러오지 못했습니다. 다시 시도해주세요.
        </p>
      </Modal>
    );
  }

  const selectedTags = selectedTagIds
    .map((tagId) => tagsData?.tags?.find((tag: Tag) => tag.id === tagId))
    .filter((tag): tag is Tag => Boolean(tag));

  const totalTargetPercentage = Object.values(targetAllocations).reduce(
    (sum, value) => {
      if (typeof value !== 'string') {
        return sum;
      }

      const trimmed = value.trim();
      if (trimmed === '') {
        return sum;
      }

      const parsed = Number(trimmed);
      return Number.isFinite(parsed) ? sum + parsed : sum;
    },
    0,
  );

  const modalSubtitle = analysis?.lastUpdated
    ? `마지막 업데이트: ${formatLastUpdated(analysis.lastUpdated)}`
    : undefined;

  return (
    <Modal
      open={open}
      title={group.name}
      subtitle={modalSubtitle}
      onClose={onClose}
      actions={
        <ButtonGroup>
          <Button variant="primary" onClick={handleSaveAll} disabled={isSaving}>
            {isSaving ? '저장 중...' : '저장'}
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteGroup}
            disabled={isDeleting}
          >
            {isDeleting ? '삭제 중...' : '삭제'}
          </Button>
        </ButtonGroup>
      }
    >
      <DetailContainer>
        <DetailHeader>
          <DetailTitle>{group.name}</DetailTitle>
          <DetailSubtitle>
            {group.description && group.description.length > 0
              ? group.description
              : '리밸런싱 전략을 자세히 관리할 수 있습니다.'}
          </DetailSubtitle>
        </DetailHeader>

        <SummaryBadges>
          <InlineLabel>총 평가 금액</InlineLabel>
          <ValueBadge>
            {analysis ? currencyFormatter.format(analysis.totalValue) : '-'}
          </ValueBadge>
          <InlineLabel>기준 통화</InlineLabel>
          <ValueBadge>{baseCurrency}</ValueBadge>
          <InlineLabel>마지막 업데이트</InlineLabel>
          <ValueBadge>
            {analysis?.lastUpdated
              ? formatLastUpdated(analysis.lastUpdated)
              : '-'}
          </ValueBadge>
        </SummaryBadges>

        <Form as="div">
          <ModalSection>
            <Field>
              <FieldLabel htmlFor="group-name-input">그룹 이름</FieldLabel>
              <TextInput
                id="group-name-input"
                value={nameInput}
                onChange={(event) => setNameInput(event.target.value)}
                placeholder="그룹 이름을 입력하세요"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="group-description-input">설명</FieldLabel>
              <TextInput
                id="group-description-input"
                value={descriptionInput}
                onChange={(event) => setDescriptionInput(event.target.value)}
                placeholder="그룹 설명을 입력하세요"
              />
            </Field>
          </ModalSection>
        </Form>

        <ModalSection>
          <InlineLabel>선택된 태그</InlineLabel>
          <TagContainer>
            {selectedTags.length === 0 ? (
              <HelperText>선택된 태그가 없습니다.</HelperText>
            ) : (
              <TagList>
                {selectedTags.map((tag) => (
                  <TagChip key={tag.id} color={tag.color}>
                    {tag.name}
                  </TagChip>
                ))}
              </TagList>
            )}
          </TagContainer>
        </ModalSection>

        <Form as="div">
          <ModalSection>
            <FieldLabel as="h4">태그 구성</FieldLabel>
            <TagSelectionGrid>
              {tagsData?.tags?.map((tag: Tag) => (
                <label
                  key={tag.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedTagIds.includes(tag.id)}
                    onChange={() => handleToggleTag(tag.id)}
                  />
                  <span>
                    <span
                      aria-hidden="true"
                      style={{
                        display: 'inline-block',
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: tag.color,
                        marginRight: '6px',
                      }}
                    />
                    {tag.name}
                  </span>
                </label>
              ))}
            </TagSelectionGrid>
            {selectedTagIds.length === 0 ? (
              <HelperText>
                최소 한 개 이상의 태그를 선택해야 정확한 분석이 가능합니다.
              </HelperText>
            ) : null}
          </ModalSection>
        </Form>

        <Form as="div">
          <ModalSection>
            <FieldLabel as="h4">목표 비율 설정</FieldLabel>
            {selectedTagIds.length === 0 ? (
              <HelperText>
                먼저 태그를 선택한 뒤 목표 비율을 설정하세요.
              </HelperText>
            ) : (
              <AllocationTable>
                <thead>
                  <tr>
                    <Th>태그</Th>
                    <Th>현재 비율</Th>
                    <Th>목표 비율 입력 (%)</Th>
                  </tr>
                </thead>
                <tbody>
                  {selectedTagIds.map((tagId) => {
                    const tag = tagsData?.tags?.find(
                      (item: Tag) => item.id === tagId,
                    );
                    const allocation = analysis?.allocations.find(
                      (item) => item.tagId === tagId,
                    );

                    if (!tag) {
                      return null;
                    }

                    return (
                      <tr key={tagId}>
                        <Td>
                          <TagChip color={tag.color}>{tag.name}</TagChip>
                        </Td>
                        <Td>
                          {allocation
                            ? `${allocation.currentPercentage.toFixed(1)}%`
                            : '-'}
                        </Td>
                        <Td>
                          <TextInput
                            type="number"
                            inputMode="decimal"
                            min="0"
                            max="100"
                            step="0.1"
                            aria-label={`${tag.name} 목표 비율`}
                            value={targetAllocations[tagId] ?? ''}
                            onChange={(event) => {
                              const { value } = event.target;
                              setTargetAllocations((prev) => ({
                                ...prev,
                                [tagId]: value,
                              }));
                            }}
                          />
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </AllocationTable>
            )}
            <HelperText>
              현재 합계: {totalTargetPercentage.toFixed(1)}% (100%가 되어야
              합니다)
            </HelperText>
          </ModalSection>
        </Form>

        {analysis && (
          <ModalSection>
            <FieldLabel as="h4">자산 배분 현황</FieldLabel>
            <AllocationGrid>
              <div>
                <h4>
                  현재 vs 목표 자산 배분
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
                    <BarChart
                      data={
                        analysis.allocations.map((item) => ({
                          ...item,
                          barCurrent:
                            chartMode === 'percentage'
                              ? item.currentPercentage
                              : item.currentValue,
                          barTarget:
                            chartMode === 'percentage'
                              ? item.targetPercentage
                              : (item.targetPercentage / 100) *
                                (analysis.totalValue ?? 0),
                        })) as unknown as Record<string, unknown>[]
                      }
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="tagName" />
                      <YAxis
                        tickFormatter={(value: number) =>
                          chartMode === 'percentage'
                            ? `${value.toFixed(0)}%`
                            : currencyFormatter.format(value)
                        }
                      />
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
                <h4>현재 자산 배분</h4>
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
                        outerRadius={90}
                        fill="#8884d8"
                        dataKey="pieValue"
                        paddingAngle={1}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.tagColor} />
                        ))}
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
          </ModalSection>
        )}

        <ModalSection>
          <FieldLabel as="h4">투자 추천</FieldLabel>
          <Field>
            <FieldLabel htmlFor="investment-amount-input">
              투자 예정 금액 ({currencySymbol})
            </FieldLabel>
            <TextInput
              id="investment-amount-input"
              type="number"
              inputMode="decimal"
              min="0"
              step={isZeroDecimalCurrency ? 1000 : 100}
              value={investmentAmountInput}
              onChange={(event) => setInvestmentAmountInput(event.target.value)}
              placeholder="투자 금액을 입력하세요"
            />
          </Field>

          {shouldSkipRecommendation ? (
            <HelperText>
              투자 금액을 입력하면 추천 결과가 표시됩니다.
            </HelperText>
          ) : null}

          {!shouldSkipRecommendation && recommendations.length > 0 && (
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
                {recommendations.map((rec) => (
                  <tr key={rec.tagId}>
                    <Td>
                      <TagChip
                        color={
                          tagsData?.tags?.find(
                            (tag: Tag) => tag.id === rec.tagId,
                          )?.color ?? '#ccc'
                        }
                      >
                        {rec.tagName}
                      </TagChip>
                    </Td>
                    <Td>{currencyFormatter.format(rec.recommendedAmount)}</Td>
                    <Td>{rec.recommendedPercentage.toFixed(1)}%</Td>
                    <Td>{rec.suggestedSymbols.join(', ') || '-'}</Td>
                  </tr>
                ))}
              </tbody>
            </AllocationTable>
          )}
        </ModalSection>
      </DetailContainer>
    </Modal>
  );
};
