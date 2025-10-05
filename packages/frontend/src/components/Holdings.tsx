import React, { useEffect, useMemo, useState } from 'react';
// switch to generated hooks
import {
  useGetHoldingsQuery,
  useGetTagsQuery,
  useGetMarketsQuery,
  useGetHoldingTagsQuery,
  useSetHoldingTagsMutation,
  useCreateManualHoldingMutation,
  useSetManualHoldingQuantityMutation,
  useDeleteManualHoldingMutation,
  useSyncManualHoldingPriceMutation,
  useGetBrokerageAccountsQuery,
  useSetHoldingAliasMutation,
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
  text-align: center;
  font-weight: ${(props) => props.theme.typography.fontWeight.semibold};
`;

const Td = styled.td`
  padding: ${(props) => props.theme.spacing.md};
  border-bottom: 1px solid ${(props) => props.theme.colors.border};
  vertical-align: middle;
  text-align: center;
`;

const CellContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
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
  justify-content: center;
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
  width: 100%;
  max-width: 720px;
  max-height: 80vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing.lg};
  box-shadow: ${(props) => props.theme.shadows.md};
`;

const TableRow = styled.tr`
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${(props) => props.theme.colors.light};
  }
`;

const PriceWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${(props) => props.theme.spacing.xs};
`;

const IconButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background-color: ${(props) => props.theme.colors.light};
  color: ${(props) => props.theme.colors.text};
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;

  &:hover {
    background-color: ${(props) => props.theme.colors.primary};
    color: white;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ModalHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing.xs};
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: ${(props) => props.theme.typography.fontSize.lg};
`;

const ModalSubtitle = styled.span`
  font-size: ${(props) => props.theme.typography.fontSize.sm};
  color: ${(props) => props.theme.colors.text};
  opacity: 0.7;
`;

const ModalBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing.lg};
`;

const SectionGroup = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing.xs};
`;

const SectionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${(props) => props.theme.spacing.sm};
`;

const InlineLabel = styled.span`
  font-size: ${(props) => props.theme.typography.fontSize.xs};
  color: ${(props) => props.theme.colors.textLight};
`;

const ValueBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: ${(props) => props.theme.spacing.xs}
    ${(props) => props.theme.spacing.sm};
  background-color: ${(props) => props.theme.colors.light};
  color: ${(props) => props.theme.colors.text};
  border-radius: ${(props) => props.theme.borderRadius.sm};
  font-size: ${(props) => props.theme.typography.fontSize.sm};
  font-weight: ${(props) => props.theme.typography.fontWeight.medium};
`;

const TextInput = styled.input`
  padding: ${(props) => props.theme.spacing.xs}
    ${(props) => props.theme.spacing.sm};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.sm};
  font-size: ${(props) => props.theme.typography.fontSize.sm};
  width: 100%;
`;

const AliasInput = styled(TextInput)`
  max-width: 240px;
`;

const QuantityInput = styled.input<{ invalid?: boolean }>`
  width: 120px;
  padding: ${(props) => props.theme.spacing.xs}
    ${(props) => props.theme.spacing.sm};
  border: 1px solid
    ${({ invalid, theme }) =>
      invalid ? theme.colors.danger : theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.sm};
  font-size: ${(props) => props.theme.typography.fontSize.sm};
  outline: none;

  &:focus {
    border-color: ${({ invalid, theme }) =>
      invalid ? theme.colors.danger : theme.colors.primary};
    box-shadow: 0 0 0 1px
      ${({ invalid, theme }) =>
        (invalid ? theme.colors.danger : theme.colors.primary) + '33'};
  }
`;

const HelperText = styled.span`
  font-size: ${(props) => props.theme.typography.fontSize.xs};
  color: ${(props) => props.theme.colors.textLight};
`;

const TagActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.spacing.xs};
  flex-wrap: wrap;
`;

const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${(props) => props.theme.spacing.xs};
`;

const TagChip = styled.span<{ color: string }>`
  display: inline-flex;
  align-items: center;
  gap: ${(props) => props.theme.spacing.xs};
  padding: ${(props) => props.theme.spacing.xs}
    ${(props) => props.theme.spacing.sm};
  background-color: ${(props) => props.color};
  color: white;
  border-radius: ${(props) => props.theme.borderRadius.sm};
  font-size: ${(props) => props.theme.typography.fontSize.xs};
  font-weight: ${(props) => props.theme.typography.fontWeight.medium};
`;

const TagRemoveButton = styled.button`
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: ${(props) => props.theme.typography.fontSize.sm};
  line-height: 1;
  padding: 0;

  &:hover {
    opacity: 0.8;
  }
`;

const AddTagButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${(props) => props.theme.spacing.xs};
  padding: ${(props) => props.theme.spacing.xs}
    ${(props) => props.theme.spacing.sm};
  border: 1px dashed ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.sm};
  background: transparent;
  cursor: pointer;
  font-size: ${(props) => props.theme.typography.fontSize.xs};

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const TagSelect = styled.select`
  padding: ${(props) => props.theme.spacing.xs}
    ${(props) => props.theme.spacing.sm};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.sm};
  font-size: ${(props) => props.theme.typography.fontSize.xs};
`;

const ModalActions = styled.div`
  margin-top: ${(props) => props.theme.spacing.xl};
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: ${(props) => props.theme.spacing.sm};
`;

const ModalButton = styled(Button)`
  margin-left: 0;
  min-width: 96px;
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
  alias: string | null;
  quantity: number;
  currentPrice: number;
  marketValue: number;
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
  const [selectedHoldingId, setSelectedHoldingId] = useState<string | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [aliasInput, setAliasInput] = useState('');
  const [quantityDeltaInput, setQuantityDeltaInput] = useState('');
  const [quantityTargetInput, setQuantityTargetInput] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [syncingHoldingId, setSyncingHoldingId] = useState<string | null>(null);

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
    data: holdingTagsListData,
    loading: holdingTagsLoading,
    refetch: refetchHoldingTagsList,
  } = useGetHoldingTagsQuery();
  const { data: brokerageAccountsData, loading: brokerageAccountsLoading } =
    useGetBrokerageAccountsQuery();

  const [setHoldingTags] = useSetHoldingTagsMutation();
  const [createManualHoldingMutation, { loading: creatingManualHolding }] =
    useCreateManualHoldingMutation();
  const [setManualHoldingQuantityMutation] =
    useSetManualHoldingQuantityMutation();
  const [deleteManualHoldingMutation] = useDeleteManualHoldingMutation();
  const [syncManualHoldingPriceMutation] = useSyncManualHoldingPriceMutation();
  const [setHoldingAliasMutation] = useSetHoldingAliasMutation();

  const holdings = useMemo(
    () => holdingsData?.holdings ?? [],
    [holdingsData?.holdings],
  );
  const manualHoldings = useMemo(
    () => holdings.filter((holding) => holding.source === 'MANUAL'),
    [holdings],
  );
  const markets = useMemo(
    () => marketsData?.markets ?? [],
    [marketsData?.markets],
  );
  const tags = useMemo(() => tagsData?.tags ?? [], [tagsData?.tags]);

  const holdingTagsBySymbol = useMemo(() => {
    const map = new Map<string, string[]>();
    (holdingTagsListData?.holdingTags ?? []).forEach((link) => {
      const current = map.get(link.holdingSymbol) ?? [];
      current.push(link.tagId);
      map.set(link.holdingSymbol, current);
    });
    return map;
  }, [holdingTagsListData?.holdingTags]);

  const tagById = useMemo(
    () => new Map(tags.map((tag) => [tag.id, tag])),
    [tags],
  );

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

  const selectedHolding = useMemo(
    () => holdings.find((holding) => holding.id === selectedHoldingId) ?? null,
    [holdings, selectedHoldingId],
  );

  const selectedHoldingTags = useMemo(
    () =>
      selectedHolding
        ? (holdingTagsBySymbol.get(selectedHolding.symbol) ?? [])
        : [],
    [selectedHolding, holdingTagsBySymbol],
  );

  const manualQuantityState = useMemo(() => {
    if (!selectedHolding || selectedHolding.source !== 'MANUAL') {
      return {
        isProvided: false,
        isValid: true,
        delta: 0,
        preview: null as number | null,
        mode: null as 'delta' | 'target' | null,
      };
    }

    const deltaTrimmed = quantityDeltaInput.trim();
    const targetTrimmed = quantityTargetInput.trim();
    const baseQuantity = selectedHolding.quantity;

    if (targetTrimmed.length > 0) {
      const normalizedTarget = targetTrimmed.replace(/,/g, '');
      const parsedTarget = Number(normalizedTarget);

      if (!Number.isFinite(parsedTarget) || parsedTarget < 0) {
        return {
          isProvided: true,
          isValid: false,
          delta: null,
          preview: null,
          mode: 'target' as const,
        };
      }

      const deltaValue = parsedTarget - baseQuantity;

      return {
        isProvided: true,
        isValid: true,
        delta: deltaValue,
        preview: parsedTarget,
        mode: 'target' as const,
      };
    }

    if (deltaTrimmed.length === 0) {
      return {
        isProvided: false,
        isValid: true,
        delta: 0,
        preview: baseQuantity,
        mode: null as const,
      };
    }

    if (deltaTrimmed === '+' || deltaTrimmed === '-') {
      return {
        isProvided: true,
        isValid: false,
        delta: null,
        preview: null,
        mode: 'delta' as const,
      };
    }

    const normalizedDelta = deltaTrimmed.replace(/,/g, '');
    const parsed = Number(normalizedDelta);
    if (!Number.isFinite(parsed)) {
      return {
        isProvided: true,
        isValid: false,
        delta: null,
        preview: null,
        mode: 'delta' as const,
      };
    }

    const nextQuantity = baseQuantity + parsed;
    if (nextQuantity < 0) {
      return {
        isProvided: true,
        isValid: false,
        delta: parsed,
        preview: null,
        mode: 'delta' as const,
      };
    }

    return {
      isProvided: true,
      isValid: true,
      delta: parsed,
      preview: nextQuantity,
      mode: 'delta' as const,
    };
  }, [quantityDeltaInput, quantityTargetInput, selectedHolding]);

  const manualQuantitySummary = useMemo(() => {
    if (!selectedHolding || selectedHolding.source !== 'MANUAL') {
      return '';
    }

    if (!manualQuantityState.isProvided) {
      return '증감 수량 또는 목표 수량을 입력하면 변경 후 수량이 계산됩니다.';
    }

    if (!manualQuantityState.isValid || manualQuantityState.preview === null) {
      if (manualQuantityState.mode === 'target') {
        return '유효한 목표 수량을 입력해주세요.';
      }
      return '유효한 증감 수량을 입력해주세요.';
    }

    const deltaValue = manualQuantityState.delta ?? 0;

    if (Math.abs(deltaValue) < 1e-6) {
      if (manualQuantityState.mode === 'target') {
        return `목표 수량이 현재 수량과 동일합니다.`;
      }
      return `현재 수량 ${selectedHolding.quantity.toLocaleString()} (변경 없음)`;
    }

    const sign = deltaValue > 0 ? '+' : '';
    if (manualQuantityState.mode === 'target') {
      return `목표 ${manualQuantityState.preview.toLocaleString()}로 변경됩니다 (현재 대비 ${sign}${deltaValue.toLocaleString()}).`;
    }
    return `현재 ${selectedHolding.quantity.toLocaleString()} → ${manualQuantityState.preview.toLocaleString()} (${sign}${deltaValue.toLocaleString()})`;
  }, [manualQuantityState, selectedHolding]);

  useEffect(() => {
    if (!selectedHolding) {
      setAliasInput('');
      setQuantityDeltaInput('');
      setQuantityTargetInput('');
      setSelectedTagIds([]);
      setIsAddingTag(false);
      return;
    }

    setAliasInput(selectedHolding.alias ?? '');
    setQuantityDeltaInput('');
    setQuantityTargetInput('');
    setSelectedTagIds(selectedHoldingTags);
    setIsAddingTag(false);
  }, [selectedHolding, selectedHoldingTags]);

  useEffect(() => {
    if (!selectedHolding && isModalOpen) {
      setIsModalOpen(false);
      setSelectedHoldingId(null);
    }
  }, [selectedHolding, isModalOpen]);

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

  const availableTagsForSelection = useMemo(() => {
    if (tags.length === 0) {
      return [];
    }
    return tags.filter((tag) => !selectedTagIds.includes(tag.id));
  }, [tags, selectedTagIds]);

  useEffect(() => {
    if (isAddingTag && availableTagsForSelection.length === 0) {
      setIsAddingTag(false);
    }
  }, [isAddingTag, availableTagsForSelection.length]);

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

  const formatMarketWithSymbol = (
    market: string | null | undefined,
    symbol: string,
  ) => {
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
      await Promise.all([refetchHoldings(), refetchHoldingTagsList()]);
    } catch (error) {
      console.error('수동 보유 종목 생성 실패:', error);
    }
  };

  const handleManualSync = async (
    holding: Holding,
    event?: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event?.stopPropagation();
    if (holding.source !== 'MANUAL' || !holding.market) {
      return;
    }
    try {
      setSyncingHoldingId(holding.id);
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
      alert('현재가 동기화에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSyncingHoldingId(null);
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
      alert('전체 동기화에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSyncingAll(false);
    }
  };

  const handleRowClick = (holdingId: string) => {
    setSelectedHoldingId(holdingId);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedHoldingId(null);
  };

  const handleTagRemove = (tagId: string) => {
    setSelectedTagIds((prev) => prev.filter((id) => id !== tagId));
  };

  const handleTagAdd = (tagId: string) => {
    if (!tagId) {
      return;
    }
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev : [...prev, tagId],
    );
    setIsAddingTag(false);
  };

  const handleQuantityDeltaChange = (rawValue: string) => {
    const normalized = rawValue.replace(/,/g, '');
    const trimmed = normalized.trim();

    if (trimmed === '') {
      setQuantityDeltaInput('');
      return;
    }

    const quantityPattern = /^[-+]?(\d+(\.\d*)?|\.\d*)?$/;
    if (!quantityPattern.test(trimmed)) {
      return;
    }

    setQuantityDeltaInput(trimmed);
    setQuantityTargetInput('');
  };

  const handleQuantityTargetChange = (rawValue: string) => {
    const normalized = rawValue.replace(/,/g, '');
    const trimmed = normalized.trim();

    if (trimmed === '') {
      setQuantityTargetInput('');
      return;
    }

    const quantityPattern = /^(\d+(\.\d*)?|\.\d*)?$/;
    if (!quantityPattern.test(trimmed)) {
      return;
    }

    setQuantityTargetInput(trimmed);
    setQuantityDeltaInput('');
  };

  const handleSave = async () => {
    if (!selectedHolding) {
      return;
    }

    const trimmedAlias = aliasInput.trim();
    const originalAlias = selectedHolding.alias ?? '';
    const aliasChanged = trimmedAlias !== originalAlias;
    const aliasPayload = trimmedAlias.length === 0 ? null : trimmedAlias;

    let quantityChanged = false;
    let parsedQuantity: number | null = null;

    if (selectedHolding.source === 'MANUAL') {
      if (!manualQuantityState.isProvided) {
        parsedQuantity = selectedHolding.quantity;
        quantityChanged = false;
      } else if (
        !manualQuantityState.isValid ||
        manualQuantityState.preview === null
      ) {
        if (manualQuantityState.mode === 'target') {
          alert('유효한 목표 수량을 입력해주세요.');
        } else {
          alert('유효한 증감 수량을 입력해주세요.');
        }
        return;
      } else {
        const nextQuantity = manualQuantityState.preview;
        parsedQuantity = nextQuantity;
        quantityChanged =
          Math.abs(nextQuantity - selectedHolding.quantity) > 1e-6;
      }
    }

    const originalTags = [...selectedHoldingTags].sort();
    const nextTags = [...selectedTagIds].sort();
    const tagsChanged =
      originalTags.length !== nextTags.length ||
      originalTags.some((tagId, index) => tagId !== nextTags[index]);

    if (!aliasChanged && !tagsChanged && !quantityChanged) {
      alert('변경된 내용이 없습니다.');
      return;
    }

    if (!window.confirm('변경 사항을 저장하시겠습니까?')) {
      return;
    }

    try {
      setIsSaving(true);

      if (aliasChanged) {
        await setHoldingAliasMutation({
          variables: {
            input: {
              holdingId: selectedHolding.id,
              alias: aliasPayload,
            },
          },
        });
      }

      if (
        selectedHolding.source === 'MANUAL' &&
        quantityChanged &&
        parsedQuantity !== null
      ) {
        if (!selectedHolding.market) {
          alert('시장 정보가 없어 수량을 저장할 수 없습니다.');
        } else {
          await setManualHoldingQuantityMutation({
            variables: {
              input: {
                accountId: selectedHolding.accountId,
                market: selectedHolding.market,
                symbol: selectedHolding.symbol,
                quantity: parsedQuantity,
              },
            },
          });
        }
      }

      if (tagsChanged) {
        await setHoldingTags({
          variables: {
            input: {
              holdingSymbol: selectedHolding.symbol,
              tagIds: selectedTagIds,
            },
          },
        });
      }

      await Promise.all([refetchHoldings(), refetchHoldingTagsList()]);
      handleModalClose();
    } catch (error) {
      console.error('보유 종목 저장 실패:', error);
      alert('변경 사항을 저장하지 못했습니다. 다시 시도해주세요.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedHolding) {
      return;
    }

    if (selectedHolding.source !== 'MANUAL') {
      alert('자동 연동 종목은 삭제할 수 없습니다.');
      return;
    }

    if (!selectedHolding.market) {
      alert('시장 정보가 없어 삭제할 수 없습니다.');
      return;
    }

    if (!window.confirm('정말로 이 종목을 삭제하시겠습니까?')) {
      return;
    }

    try {
      setIsDeleting(true);
      await deleteManualHoldingMutation({
        variables: {
          input: {
            accountId: selectedHolding.accountId,
            market: selectedHolding.market,
            symbol: selectedHolding.symbol,
          },
        },
      });
      await Promise.all([refetchHoldings(), refetchHoldingTagsList()]);
      handleModalClose();
    } catch (error) {
      console.error('보유 종목 삭제 실패:', error);
      alert('종목을 삭제하지 못했습니다. 다시 시도해주세요.');
    } finally {
      setIsDeleting(false);
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
          </tr>
        </thead>
        <tbody>
          {holdings.length === 0 ? (
            <tr>
              <Td colSpan={7}>등록된 보유 종목이 없습니다.</Td>
            </tr>
          ) : (
            holdings.map((holding) => {
              const tagIds = holdingTagsBySymbol.get(holding.symbol) ?? [];
              const accountName =
                accountNameById.get(holding.accountId) ?? '미지정 계좌';
              const sourceDescription =
                holding.source === 'MANUAL' ? '수동 입력' : '자동 연동';
              const displayName =
                holding.alias && holding.alias.trim().length > 0
                  ? holding.alias
                  : holding.name;
              const subtitle = formatMarketWithSymbol(
                holding.market,
                holding.symbol,
              );
              const tagsForRow = tagIds
                .map((tagId) => tagById.get(tagId))
                .filter((tag): tag is Tag => Boolean(tag));

              return (
                <TableRow
                  key={holding.id}
                  onClick={() => handleRowClick(holding.id)}
                >
                  <Td>
                    <CellContent>
                      <PrimaryText>{accountName}</PrimaryText>
                      <SecondaryText>{sourceDescription}</SecondaryText>
                    </CellContent>
                  </Td>
                  <Td>
                    <CellContent>
                      <PrimaryText>{displayName}</PrimaryText>
                      {holding.alias && holding.alias.trim().length > 0 ? (
                        <>
                          <SecondaryText>{holding.name}</SecondaryText>
                          <SecondaryText>{subtitle}</SecondaryText>
                        </>
                      ) : (
                        <SecondaryText>{subtitle}</SecondaryText>
                      )}
                    </CellContent>
                  </Td>
                  <Td>{holding.quantity.toLocaleString()}</Td>
                  <Td>
                    <PriceWrapper>
                      <PrimaryText>
                        {formatCurrencyValue(
                          holding.currentPrice,
                          holding.currency,
                        )}
                      </PrimaryText>
                      {holding.source === 'MANUAL' && holding.market && (
                        <IconButton
                          type="button"
                          aria-label="현재가 동기화"
                          onClick={(event) => handleManualSync(holding, event)}
                          disabled={syncingHoldingId === holding.id}
                        >
                          {syncingHoldingId === holding.id ? '···' : '↻'}
                        </IconButton>
                      )}
                    </PriceWrapper>
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
                      {tagsForRow.length === 0 ? (
                        <SecondaryText>태그 없음</SecondaryText>
                      ) : (
                        tagsForRow.map((tag) => (
                          <Tag
                            key={`${holding.id}-${tag.id}`}
                            color={tag.color}
                          >
                            {tag.name}
                          </Tag>
                        ))
                      )}
                    </TagContainer>
                  </Td>
                </TableRow>
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
              disabled={brokerageAccountsLoading || manualAccounts.length === 0}
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

      {isModalOpen && selectedHolding && (
        <Modal onClick={handleModalClose}>
          <ModalContent onClick={(event) => event.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                {selectedHolding.alias &&
                selectedHolding.alias.trim().length > 0
                  ? selectedHolding.alias
                  : selectedHolding.name}
              </ModalTitle>
              <ModalSubtitle>
                {formatMarketWithSymbol(
                  selectedHolding.market,
                  selectedHolding.symbol,
                )}
              </ModalSubtitle>
            </ModalHeader>

            <ModalBody>
              <SectionGroup>
                <SectionRow>
                  <InlineLabel>계좌</InlineLabel>
                  <ValueBadge>
                    {accountNameById.get(selectedHolding.accountId) ??
                      '미지정 계좌'}
                  </ValueBadge>
                  <InlineLabel>입력 방식</InlineLabel>
                  <ValueBadge>
                    {selectedHolding.source === 'MANUAL'
                      ? '수동 입력'
                      : '자동 연동'}
                  </ValueBadge>
                </SectionRow>
                <SectionRow>
                  <InlineLabel>원래 이름</InlineLabel>
                  <ValueBadge>{selectedHolding.name}</ValueBadge>
                </SectionRow>
                <SectionRow>
                  <InlineLabel as="label" htmlFor="holding-alias">
                    표시 이름
                  </InlineLabel>
                  <AliasInput
                    id="holding-alias"
                    value={aliasInput}
                    onChange={(event) => setAliasInput(event.target.value)}
                    placeholder="표시 이름을 입력하세요"
                  />
                </SectionRow>
              </SectionGroup>

              {selectedHolding.source === 'MANUAL' ? (
                <SectionGroup>
                  <SectionRow>
                    <InlineLabel>현재</InlineLabel>
                    <ValueBadge>
                      {selectedHolding.quantity.toLocaleString()}
                    </ValueBadge>
                    <InlineLabel>증감</InlineLabel>
                    <QuantityInput
                      inputMode="decimal"
                      pattern="[-+]?\\d*(\\.\\d*)?"
                      placeholder="+100"
                      value={quantityDeltaInput}
                      onChange={(event) =>
                        handleQuantityDeltaChange(event.target.value)
                      }
                      disabled={isSaving}
                      invalid={
                        manualQuantityState.mode === 'delta' &&
                        manualQuantityState.isProvided &&
                        (!manualQuantityState.isValid ||
                          manualQuantityState.preview === null)
                      }
                    />
                    <InlineLabel>목표</InlineLabel>
                    <QuantityInput
                      inputMode="decimal"
                      pattern="\\d*(\\.\\d*)?"
                      placeholder={selectedHolding.quantity.toLocaleString()}
                      value={quantityTargetInput}
                      onChange={(event) =>
                        handleQuantityTargetChange(event.target.value)
                      }
                      disabled={isSaving}
                      invalid={
                        manualQuantityState.mode === 'target' &&
                        manualQuantityState.isProvided &&
                        (!manualQuantityState.isValid ||
                          manualQuantityState.preview === null)
                      }
                    />
                  </SectionRow>
                  <SectionRow>
                    <InlineLabel>변경 후</InlineLabel>
                    <ValueBadge>
                      {manualQuantityState.preview !== null
                        ? manualQuantityState.preview.toLocaleString()
                        : '—'}
                    </ValueBadge>
                  </SectionRow>
                  <HelperText>{manualQuantitySummary}</HelperText>
                </SectionGroup>
              ) : (
                <SectionGroup>
                  <SectionRow>
                    <InlineLabel>수량</InlineLabel>
                    <ValueBadge>
                      {selectedHolding.quantity.toLocaleString()}
                    </ValueBadge>
                  </SectionRow>
                </SectionGroup>
              )}

              <SectionGroup>
                <SectionRow>
                  <InlineLabel>태그</InlineLabel>
                  <TagActions>
                    {holdingTagsLoading ? (
                      <HelperText>태그를 불러오는 중...</HelperText>
                    ) : selectedTagIds.length === 0 ? (
                      <HelperText>선택된 태그가 없습니다.</HelperText>
                    ) : (
                      <TagList>
                        {selectedTagIds
                          .map((tagId) => tagById.get(tagId))
                          .filter((tag): tag is Tag => Boolean(tag))
                          .map((tag) => (
                            <TagChip key={tag.id} color={tag.color}>
                              {tag.name}
                              <TagRemoveButton
                                type="button"
                                onClick={() => handleTagRemove(tag.id)}
                              >
                                ×
                              </TagRemoveButton>
                            </TagChip>
                          ))}
                      </TagList>
                    )}
                    {isAddingTag && availableTagsForSelection.length > 0 && (
                      <TagSelect
                        defaultValue=""
                        onChange={(event) => {
                          handleTagAdd(event.target.value);
                          event.currentTarget.value = '';
                        }}
                      >
                        <option value="" disabled>
                          태그 선택
                        </option>
                        {availableTagsForSelection.map((tag) => (
                          <option key={tag.id} value={tag.id}>
                            {tag.name}
                          </option>
                        ))}
                      </TagSelect>
                    )}
                    <AddTagButton
                      type="button"
                      onClick={() => {
                        if (isAddingTag) {
                          setIsAddingTag(false);
                          return;
                        }
                        if (availableTagsForSelection.length === 0) {
                          return;
                        }
                        setIsAddingTag(true);
                      }}
                      disabled={
                        holdingTagsLoading ||
                        (!isAddingTag && availableTagsForSelection.length === 0)
                      }
                    >
                      {isAddingTag ? '닫기' : '태그 선택'}
                    </AddTagButton>
                  </TagActions>
                </SectionRow>
                {!holdingTagsLoading &&
                  availableTagsForSelection.length === 0 &&
                  tags.length > 0 && (
                    <HelperText>추가 가능한 태그가 없습니다.</HelperText>
                  )}
              </SectionGroup>

              <SectionGroup>
                <SectionRow>
                  <InlineLabel>현재가</InlineLabel>
                  <ValueBadge>
                    {formatCurrencyValue(
                      selectedHolding.currentPrice,
                      selectedHolding.currency,
                    )}
                  </ValueBadge>
                  {selectedHolding.source === 'MANUAL' &&
                    selectedHolding.market && (
                      <IconButton
                        type="button"
                        aria-label="현재가 동기화"
                        onClick={(event) =>
                          handleManualSync(selectedHolding, event)
                        }
                        disabled={syncingHoldingId === selectedHolding.id}
                      >
                        {syncingHoldingId === selectedHolding.id ? '···' : '↻'}
                      </IconButton>
                    )}
                  <InlineLabel>마지막 업데이트</InlineLabel>
                  <ValueBadge>
                    {formatLastUpdated(selectedHolding.lastUpdated)}
                  </ValueBadge>
                </SectionRow>
              </SectionGroup>
            </ModalBody>

            <ModalActions>
              <ModalButton
                type="button"
                variant="primary"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? '저장 중...' : '저장'}
              </ModalButton>
              <ModalButton
                type="button"
                variant="danger"
                onClick={handleDelete}
                disabled={isDeleting || selectedHolding.source !== 'MANUAL'}
              >
                {isDeleting ? '삭제 중...' : '삭제'}
              </ModalButton>
            </ModalActions>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
};
