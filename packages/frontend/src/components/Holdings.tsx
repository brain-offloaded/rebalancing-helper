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
  max-width: 540px;
  width: 90%;
  max-height: 70vh;
  overflow-y: auto;
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
  transition: background-color 0.2s ease, color 0.2s ease;

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

const ModalSection = styled.section`
  margin-top: ${(props) => props.theme.spacing.lg};
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing.sm};
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing.xs};
`;

const FieldLabel = styled.label`
  font-weight: ${(props) => props.theme.typography.fontWeight.semibold};
  color: ${(props) => props.theme.colors.text};
`;

const ReadonlyField = styled.span`
  display: inline-flex;
  align-items: center;
  padding: ${(props) => props.theme.spacing.xs}
    ${(props) => props.theme.spacing.sm};
  background-color: ${(props) => props.theme.colors.light};
  color: ${(props) => props.theme.colors.text};
  border-radius: ${(props) => props.theme.borderRadius.sm};
  font-size: ${(props) => props.theme.typography.fontSize.sm};
`;

const PillRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${(props) => props.theme.spacing.xs};
`;

const TextInput = styled.input`
  padding: ${(props) => props.theme.spacing.xs}
    ${(props) => props.theme.spacing.sm};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.sm};
  font-size: ${(props) => props.theme.typography.fontSize.sm};
  width: 100%;
`;

const QuantityControls = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${(props) => props.theme.spacing.xs};
`;

const QuantityInput = styled(TextInput)`
  width: 120px;
`;

const QuantityButton = styled.button`
  width: 32px;
  height: 32px;
  border-radius: ${(props) => props.theme.borderRadius.sm};
  border: 1px solid ${(props) => props.theme.colors.border};
  background-color: ${(props) => props.theme.colors.light};
  cursor: pointer;
  font-size: ${(props) => props.theme.typography.fontSize.md};
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
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
  const [quantityInput, setQuantityInput] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [syncingHoldingId, setSyncingHoldingId] = useState<string | null>(
    null,
  );

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

  const holdings = holdingsData?.holdings ?? [];
  const manualHoldings = useMemo(
    () => holdings.filter((holding) => holding.source === 'MANUAL'),
    [holdings],
  );
  const markets = useMemo(
    () => marketsData?.markets ?? [],
    [marketsData?.markets],
  );
  const tags = tagsData?.tags ?? [];

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
        ? holdingTagsBySymbol.get(selectedHolding.symbol) ?? []
        : [],
    [selectedHolding, holdingTagsBySymbol],
  );

  useEffect(() => {
    if (!selectedHolding) {
      setAliasInput('');
      setQuantityInput('');
      setSelectedTagIds([]);
      setIsAddingTag(false);
      return;
    }

    setAliasInput(selectedHolding.alias ?? '');
    setQuantityInput(selectedHolding.quantity.toString());
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
    setSelectedTagIds((prev) => (prev.includes(tagId) ? prev : [...prev, tagId]));
    setIsAddingTag(false);
  };

  const adjustQuantity = (delta: number) => {
    if (!selectedHolding || selectedHolding.source !== 'MANUAL') {
      return;
    }
    const current = Number(quantityInput || '0');
    if (!Number.isFinite(current)) {
      return;
    }
    const next = Math.max(0, Math.round((current + delta) * 100) / 100);
    setQuantityInput(next.toString());
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
      if (quantityInput.trim() === '') {
        alert('수량을 입력해주세요.');
        return;
      }
      const parsed = Number(quantityInput);
      if (!Number.isFinite(parsed) || parsed < 0) {
        alert('유효한 수량을 입력해주세요.');
        return;
      }
      parsedQuantity = parsed;
      quantityChanged = Math.abs(parsed - selectedHolding.quantity) > 1e-6;
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
      setIsModalOpen(false);
      setSelectedHoldingId(null);
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
                          <Tag key={`${holding.id}-${tag.id}`} color={tag.color}>
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
                {selectedHolding.alias && selectedHolding.alias.trim().length > 0
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

            <ModalSection>
              <FieldGroup>
                <FieldLabel>기본 정보</FieldLabel>
                <PillRow>
                  <ReadonlyField>
                    {accountNameById.get(selectedHolding.accountId) ??
                      '미지정 계좌'}
                  </ReadonlyField>
                  <ReadonlyField>
                    {selectedHolding.source === 'MANUAL'
                      ? '수동 입력'
                      : '자동 연동'}
                  </ReadonlyField>
                </PillRow>
              </FieldGroup>
              <FieldGroup>
                <FieldLabel>원래 이름</FieldLabel>
                <ReadonlyField>{selectedHolding.name}</ReadonlyField>
              </FieldGroup>
              <FieldGroup>
                <FieldLabel htmlFor="holding-alias">
                  표시 이름 (Alias)
                </FieldLabel>
                <TextInput
                  id="holding-alias"
                  value={aliasInput}
                  onChange={(event) => setAliasInput(event.target.value)}
                  placeholder="표시 이름을 입력하세요"
                />
              </FieldGroup>
            </ModalSection>

            <ModalSection>
              <FieldGroup>
                <FieldLabel>태그</FieldLabel>
                {holdingTagsLoading ? (
                  <SecondaryText>태그를 불러오는 중...</SecondaryText>
                ) : selectedTagIds.length === 0 ? (
                  <SecondaryText>선택된 태그가 없습니다.</SecondaryText>
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
                <PillRow>
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
                    onClick={() => setIsAddingTag((prev) => !prev)}
                    disabled={
                      availableTagsForSelection.length === 0 ||
                      holdingTagsLoading
                    }
                  >
                    + 태그 추가
                  </AddTagButton>
                </PillRow>
                {availableTagsForSelection.length === 0 && tags.length > 0 && (
                  <SecondaryText>추가 가능한 태그가 없습니다.</SecondaryText>
                )}
              </FieldGroup>
            </ModalSection>

            <ModalSection>
              <FieldGroup>
                <FieldLabel>수량</FieldLabel>
                {selectedHolding.source === 'MANUAL' ? (
                  <QuantityControls>
                    <QuantityButton
                      type="button"
                      onClick={() => adjustQuantity(-1)}
                      disabled={isSaving}
                    >
                      −
                    </QuantityButton>
                    <QuantityInput
                      type="number"
                      min="0"
                      step="0.01"
                      value={quantityInput}
                      onChange={(event) => setQuantityInput(event.target.value)}
                      disabled={isSaving}
                    />
                    <QuantityButton
                      type="button"
                      onClick={() => adjustQuantity(1)}
                      disabled={isSaving}
                    >
                      +
                    </QuantityButton>
                  </QuantityControls>
                ) : (
                  <ReadonlyField>
                    {selectedHolding.quantity.toLocaleString()}
                  </ReadonlyField>
                )}
              </FieldGroup>
            </ModalSection>

            <ModalSection>
              <FieldGroup>
                <FieldLabel>현재가</FieldLabel>
                <QuantityControls>
                  <ReadonlyField>
                    {formatCurrencyValue(
                      selectedHolding.currentPrice,
                      selectedHolding.currency,
                    )}
                  </ReadonlyField>
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
                        {syncingHoldingId === selectedHolding.id
                          ? '···'
                          : '↻'}
                      </IconButton>
                    )}
                </QuantityControls>
                <SecondaryText>
                  마지막 업데이트:{' '}
                  {formatLastUpdated(selectedHolding.lastUpdated)}
                </SecondaryText>
              </FieldGroup>
            </ModalSection>

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

