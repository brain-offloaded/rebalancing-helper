import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Decimal,
  createDecimal,
  toPlainString,
} from '@rebalancing-helper/common';
import {
  useCreateManualHoldingMutation,
  useDeleteManualHoldingMutation,
  useGetBrokerageAccountsQuery,
  useGetHoldingTagsQuery,
  useGetHoldingsQuery,
  useGetMarketsQuery,
  useGetTagsQuery,
  useSetHoldingAliasMutation,
  useSetHoldingTagsMutation,
  useSetManualHoldingQuantityMutation,
  useSyncManualHoldingPriceMutation,
} from '../graphql/__generated__';
import {
  Section,
  SectionDescription,
  SectionHeader,
  SectionTitle,
} from './ui/Layout';
import { HoldingsTable } from './holdings/HoldingsTable';
import { HoldingsToolbar } from './holdings/HoldingsToolbar';
import { ManualHoldingForm } from './holdings/ManualHoldingForm';
import { HoldingDetailModal } from './holdings/HoldingDetailModal';
import { formatMarketWithSymbol } from './holdings/formatters';
import type {
  Holding,
  HoldingTagLink,
  ManualAccount,
  MarketOption,
  Tag,
} from './holdings/types';
import { formatDecimal, tryCreateDecimal } from '../utils/decimal-format';

const parseQuantityInput = (rawValue: string) =>
  rawValue.replace(/,/g, '').trim();

const isValidDeltaInput = (value: string) =>
  /^[-+]?(\d+(\.\d*)?|\.\d*)?$/.test(value);

const isValidTargetInput = (value: string) =>
  /^(\d+(\.\d*)?|\.\d*)?$/.test(value);

type ManualQuantityMode = 'delta' | 'target' | null;

interface ManualQuantityState {
  isProvided: boolean;
  isValid: boolean;
  delta: Decimal | null;
  preview: Decimal | null;
  mode: ManualQuantityMode;
}

const ZERO_DELTA_THRESHOLD = createDecimal('0.0000001');

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
    data: holdingTagsData,
    loading: holdingTagsLoading,
    refetch: refetchHoldingTags,
  } = useGetHoldingTagsQuery();
  const { data: brokerageAccountsData, loading: brokerageAccountsLoading } =
    useGetBrokerageAccountsQuery();

  const [setHoldingTags] = useSetHoldingTagsMutation();
  const [createManualHolding, { loading: creatingManualHolding }] =
    useCreateManualHoldingMutation();
  const [setManualHoldingQuantity] = useSetManualHoldingQuantityMutation();
  const [deleteManualHolding] = useDeleteManualHoldingMutation();
  const [syncManualHoldingPrice] = useSyncManualHoldingPriceMutation();
  const [setHoldingAlias] = useSetHoldingAliasMutation();

  const holdings = useMemo(() => holdingsData?.holdings ?? [], [holdingsData]);
  const manualHoldings = useMemo(
    () => holdings.filter((holding) => holding.source === 'MANUAL'),
    [holdings],
  );
  const tags = useMemo(() => tagsData?.tags ?? [], [tagsData]);
  const markets = useMemo<MarketOption[]>(
    () => marketsData?.markets ?? [],
    [marketsData],
  );
  const holdingTags = useMemo<HoldingTagLink[]>(
    () => holdingTagsData?.holdingTags ?? [],
    [holdingTagsData],
  );
  const brokerageAccounts = useMemo(
    () => brokerageAccountsData?.brokerageAccounts ?? [],
    [brokerageAccountsData],
  );
  const manualAccounts = useMemo<ManualAccount[]>(
    () => brokerageAccounts.filter((account) => account.syncMode === 'MANUAL'),
    [brokerageAccounts],
  );

  const accountNameById = useMemo(
    () =>
      new Map(
        brokerageAccounts.map((account) => [
          account.id,
          account.name ?? '미지정 계좌',
        ]),
      ),
    [brokerageAccounts],
  );

  const holdingTagsBySymbol = useMemo(() => {
    const map = new Map<string, string[]>();
    holdingTags.forEach((link) => {
      const current = map.get(link.holdingSymbol) ?? [];
      current.push(link.tagId);
      map.set(link.holdingSymbol, current);
    });
    return map;
  }, [holdingTags]);

  const tagById = useMemo(
    () => new Map(tags.map((tag) => [tag.id, tag])),
    [tags],
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

  const manualQuantityState = useMemo<ManualQuantityState>(() => {
    if (!selectedHolding || selectedHolding.source !== 'MANUAL') {
      return {
        isProvided: false,
        isValid: true,
        delta: createDecimal(0),
        preview: selectedHolding
          ? createDecimal(selectedHolding.quantity)
          : null,
        mode: null,
      };
    }

    const deltaTrimmed = parseQuantityInput(quantityDeltaInput);
    const targetTrimmed = parseQuantityInput(quantityTargetInput);
    const baseQuantity = createDecimal(selectedHolding.quantity);

    if (targetTrimmed.length > 0) {
      if (!isValidTargetInput(targetTrimmed)) {
        return {
          isProvided: true,
          isValid: false,
          delta: null,
          preview: null,
          mode: 'target',
        };
      }

      const parsedTarget = tryCreateDecimal(targetTrimmed);
      if (!parsedTarget || parsedTarget.isNegative()) {
        return {
          isProvided: true,
          isValid: false,
          delta: null,
          preview: null,
          mode: 'target',
        };
      }

      return {
        isProvided: true,
        isValid: true,
        delta: parsedTarget.minus(baseQuantity),
        preview: parsedTarget,
        mode: 'target',
      };
    }

    if (deltaTrimmed.length === 0) {
      return {
        isProvided: false,
        isValid: true,
        delta: createDecimal(0),
        preview: baseQuantity,
        mode: null,
      };
    }

    if (!isValidDeltaInput(deltaTrimmed)) {
      return {
        isProvided: true,
        isValid: false,
        delta: null,
        preview: null,
        mode: 'delta',
      };
    }

    const parsedDelta = tryCreateDecimal(deltaTrimmed);
    if (!parsedDelta) {
      return {
        isProvided: true,
        isValid: false,
        delta: null,
        preview: null,
        mode: 'delta',
      };
    }

    const nextQuantity = baseQuantity.plus(parsedDelta);
    if (nextQuantity.isNegative()) {
      return {
        isProvided: true,
        isValid: false,
        delta: parsedDelta,
        preview: null,
        mode: 'delta',
      };
    }

    return {
      isProvided: true,
      isValid: true,
      delta: parsedDelta,
      preview: nextQuantity,
      mode: 'delta',
    };
  }, [quantityDeltaInput, quantityTargetInput, selectedHolding]);

  const manualQuantitySummary = useMemo(() => {
    if (!selectedHolding || selectedHolding.source !== 'MANUAL') {
      return '증감 수량 또는 목표 수량을 입력하면 변경 후 수량이 계산됩니다.';
    }

    if (!manualQuantityState.isProvided) {
      return '증감 수량 또는 목표 수량을 입력하면 변경 후 수량이 계산됩니다.';
    }

    if (!manualQuantityState.isValid || manualQuantityState.preview === null) {
      return manualQuantityState.mode === 'target'
        ? '유효한 목표 수량을 입력해주세요.'
        : '유효한 증감 수량을 입력해주세요.';
    }

    const deltaValue = manualQuantityState.delta;
    const isDeltaTrivial =
      !deltaValue || deltaValue.abs().lessThan(ZERO_DELTA_THRESHOLD);
    if (isDeltaTrivial) {
      return manualQuantityState.mode === 'target'
        ? '목표 수량이 현재 수량과 동일합니다.'
        : `현재 수량 ${formatDecimal(selectedHolding.quantity, {
            trimTrailingZeros: true,
            useGrouping: true,
          })} (변경 없음)`;
    }

    if (!deltaValue) {
      return '';
    }

    const sign = deltaValue.isPositive() ? '+' : '';
    const deltaText = formatDecimal(deltaValue, {
      trimTrailingZeros: true,
      useGrouping: true,
    });

    if (
      manualQuantityState.mode === 'target' &&
      manualQuantityState.preview !== null
    ) {
      const previewText = formatDecimal(manualQuantityState.preview, {
        trimTrailingZeros: true,
        useGrouping: true,
      });
      return `목표 ${previewText}로 변경됩니다 (현재 대비 ${sign}${deltaText}).`;
    }

    if (manualQuantityState.preview !== null) {
      const currentText = formatDecimal(selectedHolding.quantity, {
        trimTrailingZeros: true,
        useGrouping: true,
      });
      const previewText = formatDecimal(manualQuantityState.preview, {
        trimTrailingZeros: true,
        useGrouping: true,
      });
      return `현재 ${currentText} → ${previewText} (${sign}${deltaText})`;
    }

    return '';
  }, [manualQuantityState, selectedHolding]);

  const availableTagsForSelection = useMemo(() => {
    if (tags.length === 0) {
      return [] as Tag[];
    }
    return tags.filter((tag) => !selectedTagIds.includes(tag.id));
  }, [tags, selectedTagIds]);

  const holdingRows = useMemo(() => {
    return holdings.map((holding) => {
      const tagIds = holdingTagsBySymbol.get(holding.symbol) ?? [];
      const rowTags = tagIds
        .map((tagId) => tagById.get(tagId))
        .filter((tag): tag is Tag => Boolean(tag));
      const accountName =
        accountNameById.get(holding.accountId) ?? '미지정 계좌';
      const sourceDescription =
        holding.source === 'MANUAL' ? '수동 입력' : '자동 연동';
      const displayName =
        holding.alias && holding.alias.trim().length > 0
          ? holding.alias
          : holding.name;
      const subtitle = formatMarketWithSymbol(holding.market, holding.symbol);
      return {
        holding,
        accountName,
        sourceDescription,
        displayName,
        baseName: holding.name,
        subtitle,
        tags: rowTags,
      };
    });
  }, [accountNameById, holdingTagsBySymbol, holdings, tagById]);

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
  }, [isModalOpen, selectedHolding]);

  useEffect(() => {
    if (markets.length > 0 && !manualMarket) {
      setManualMarket(markets[0].code);
    }
  }, [manualMarket, markets]);

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
  }, [manualAccountId, manualAccounts]);

  useEffect(() => {
    if (isAddingTag && availableTagsForSelection.length === 0) {
      setIsAddingTag(false);
    }
  }, [availableTagsForSelection.length, isAddingTag]);

  const handleManualSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const market = manualMarket.trim().toUpperCase();
      const symbol = manualSymbol.trim().toUpperCase();
      const quantityTrimmed = parseQuantityInput(manualQuantity);
      if (!market || !symbol || quantityTrimmed === '') {
        return;
      }
      if (!manualAccountId) {
        alert('수동 입력 계좌를 선택해주세요.');
        return;
      }
      const quantityDecimal = tryCreateDecimal(quantityTrimmed);
      if (!quantityDecimal || quantityDecimal.isNegative()) {
        alert('유효한 수량을 입력해주세요.');
        return;
      }
      try {
        await createManualHolding({
          variables: {
            input: {
              accountId: manualAccountId,
              market,
              symbol,
              quantity: toPlainString(quantityDecimal, {
                trimTrailingZeros: true,
              }),
            },
          },
        });
        setManualMarket('');
        setManualSymbol('');
        setManualQuantity('');
        await Promise.all([refetchHoldings(), refetchHoldingTags()]);
      } catch (error) {
        console.error('수동 보유 종목 생성 실패:', error);
      }
    },
    [
      createManualHolding,
      manualAccountId,
      manualMarket,
      manualQuantity,
      manualSymbol,
      refetchHoldingTags,
      refetchHoldings,
    ],
  );

  const handleManualSync = useCallback(
    async (holding: Holding, event?: React.MouseEvent<HTMLButtonElement>) => {
      event?.stopPropagation();
      if (holding.source !== 'MANUAL' || !holding.market) {
        return;
      }
      try {
        setSyncingHoldingId(holding.id);
        await syncManualHoldingPrice({
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
    },
    [refetchHoldings, syncManualHoldingPrice],
  );

  const handleManualSyncAll = useCallback(async () => {
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
          syncManualHoldingPrice({
            variables: {
              input: {
                accountId: holding.accountId,
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
  }, [manualHoldings, refetchHoldings, syncManualHoldingPrice]);

  const handleRowClick = (holdingId: string) => {
    setSelectedHoldingId(holdingId);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedHoldingId(null);
  };

  const handleTagRemove = (tagId: string) => {
    setSelectedTagIds((previous) => previous.filter((id) => id !== tagId));
  };

  const handleTagSelect = (tagId: string) => {
    if (!tagId) {
      return;
    }
    setSelectedTagIds((previous) =>
      previous.includes(tagId) ? previous : [...previous, tagId],
    );
    setIsAddingTag(false);
  };

  const handleQuantityDeltaChange = (rawValue: string) => {
    const trimmed = parseQuantityInput(rawValue);
    if (trimmed === '') {
      setQuantityDeltaInput('');
      return;
    }
    if (!isValidDeltaInput(trimmed)) {
      return;
    }
    setQuantityDeltaInput(trimmed);
    setQuantityTargetInput('');
  };

  const handleQuantityTargetChange = (rawValue: string) => {
    const trimmed = parseQuantityInput(rawValue);
    if (trimmed === '') {
      setQuantityTargetInput('');
      return;
    }
    if (!isValidTargetInput(trimmed)) {
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
    let parsedQuantity: Decimal | null = null;

    if (selectedHolding.source === 'MANUAL') {
      const currentQuantity = createDecimal(selectedHolding.quantity);
      if (!manualQuantityState.isProvided) {
        quantityChanged = false;
        parsedQuantity = currentQuantity;
      } else if (
        !manualQuantityState.isValid ||
        manualQuantityState.preview === null
      ) {
        alert(
          manualQuantityState.mode === 'target'
            ? '유효한 목표 수량을 입력해주세요.'
            : '유효한 증감 수량을 입력해주세요.',
        );
        return;
      } else {
        parsedQuantity = manualQuantityState.preview;
        quantityChanged =
          parsedQuantity !== null && !parsedQuantity.eq(currentQuantity);
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
        await setHoldingAlias({
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
          await setManualHoldingQuantity({
            variables: {
              input: {
                accountId: selectedHolding.accountId,
                market: selectedHolding.market,
                symbol: selectedHolding.symbol,
                quantity: toPlainString(parsedQuantity, {
                  trimTrailingZeros: true,
                }),
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

      await Promise.all([refetchHoldings(), refetchHoldingTags()]);
      handleModalClose();
    } catch (error) {
      console.error('보유 종목 저장 실패:', error);
      alert('변경 사항을 저장하지 못했습니다. 다시 시도해주세요.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedHolding || selectedHolding.source !== 'MANUAL') {
      return;
    }
    if (!window.confirm('이 수동 종목을 삭제하시겠습니까?')) {
      return;
    }
    try {
      setIsDeleting(true);
      if (!selectedHolding.market) {
        throw new Error('시장 정보가 없습니다.');
      }
      await deleteManualHolding({
        variables: {
          input: {
            accountId: selectedHolding.accountId,
            market: selectedHolding.market,
            symbol: selectedHolding.symbol,
          },
        },
      });
      await Promise.all([refetchHoldings(), refetchHoldingTags()]);
      handleModalClose();
    } catch (error) {
      console.error('보유 종목 삭제 실패:', error);
      alert('종목을 삭제하지 못했습니다. 다시 시도해주세요.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (holdingsLoading) {
    return <div>로딩 중...</div>;
  }

  const selectedAccountName = selectedHolding
    ? (accountNameById.get(selectedHolding.accountId) ?? '미지정 계좌')
    : '';
  const selectedSourceDescription = selectedHolding
    ? selectedHolding.source === 'MANUAL'
      ? '수동 입력'
      : '자동 연동'
    : '';

  return (
    <Section>
      <SectionHeader>
        <SectionTitle>보유 종목</SectionTitle>
        <SectionDescription>
          증권사에서 가져온 보유 종목 목록입니다. 각 종목에 태그를 설정할 수
          있습니다.
        </SectionDescription>
      </SectionHeader>

      <HoldingsToolbar
        manualHoldingsCount={manualHoldings.length}
        syncingAll={syncingAll}
        onSyncAll={handleManualSyncAll}
      />

      <HoldingsTable
        rows={holdingRows}
        syncingHoldingId={syncingHoldingId}
        onRowClick={handleRowClick}
        onManualSync={handleManualSync}
      />

      <Section>
        <SectionTitle>수동 보유 종목</SectionTitle>
        <SectionDescription>
          시장에 등록된 종목을 직접 추가하면 위 보유 종목 목록에 함께
          표시됩니다.
        </SectionDescription>

        <ManualHoldingForm
          accounts={manualAccounts}
          markets={markets}
          marketLoading={marketsLoading}
          accountLoading={brokerageAccountsLoading}
          accountId={manualAccountId}
          market={manualMarket}
          symbol={manualSymbol}
          quantity={manualQuantity}
          submitting={creatingManualHolding}
          onSubmit={handleManualSubmit}
          onAccountChange={setManualAccountId}
          onMarketChange={setManualMarket}
          onSymbolChange={setManualSymbol}
          onQuantityChange={setManualQuantity}
        />

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

      <HoldingDetailModal
        open={isModalOpen}
        holding={selectedHolding}
        accountName={selectedAccountName}
        sourceDescription={selectedSourceDescription}
        aliasInput={aliasInput}
        onAliasChange={setAliasInput}
        quantityDeltaInput={quantityDeltaInput}
        onQuantityDeltaChange={handleQuantityDeltaChange}
        quantityTargetInput={quantityTargetInput}
        onQuantityTargetChange={handleQuantityTargetChange}
        quantityDeltaInvalid={
          manualQuantityState.mode === 'delta' &&
          manualQuantityState.isProvided &&
          (!manualQuantityState.isValid || manualQuantityState.preview === null)
        }
        quantityTargetInvalid={
          manualQuantityState.mode === 'target' &&
          manualQuantityState.isProvided &&
          (!manualQuantityState.isValid || manualQuantityState.preview === null)
        }
        quantitySummary={manualQuantitySummary}
        tags={tags}
        selectedTagIds={selectedTagIds}
        availableTags={availableTagsForSelection}
        isAddingTag={isAddingTag}
        holdingTagsLoading={holdingTagsLoading}
        onToggleAddingTag={() => setIsAddingTag((previous) => !previous)}
        onSelectTag={handleTagSelect}
        onRemoveTag={handleTagRemove}
        syncingHoldingId={syncingHoldingId}
        onManualSync={handleManualSync}
        onClose={handleModalClose}
        onSave={handleSave}
        onDelete={handleDelete}
        isSaving={isSaving}
        isDeleting={isDeleting}
      />
    </Section>
  );
};
