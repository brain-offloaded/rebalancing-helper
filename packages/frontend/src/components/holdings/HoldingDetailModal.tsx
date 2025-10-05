import type { MouseEvent } from 'react';
import { Button, ButtonGroup, IconButton } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Field, FieldLabel, TextInput } from '../ui/FormControls';
import {
  formatCurrencyValue,
  formatLastUpdated,
  formatMarketWithSymbol,
} from './formatters';
import type { Holding, Tag } from './types';
import {
  HelperText,
  InlineLabel,
  ModalRow,
  ModalSection,
  QuantityInput,
  TagActions,
  TagChip,
  TagContainer,
  TagList,
  TagRemoveButton,
  ValueBadge,
} from './styles';

interface HoldingDetailModalProps {
  open: boolean;
  holding: Holding | null;
  accountName: string;
  sourceDescription: string;
  aliasInput: string;
  onAliasChange: (value: string) => void;
  quantityDeltaInput: string;
  onQuantityDeltaChange: (value: string) => void;
  quantityTargetInput: string;
  onQuantityTargetChange: (value: string) => void;
  quantityDeltaInvalid: boolean;
  quantityTargetInvalid: boolean;
  quantitySummary: string;
  tags: Tag[];
  selectedTagIds: string[];
  availableTags: Tag[];
  isAddingTag: boolean;
  holdingTagsLoading: boolean;
  onToggleAddingTag: () => void;
  onSelectTag: (tagId: string) => void;
  onRemoveTag: (tagId: string) => void;
  syncingHoldingId: string | null;
  onManualSync: (
    holding: Holding,
    event?: MouseEvent<HTMLButtonElement>,
  ) => void;
  onClose: () => void;
  onSave: () => void;
  onDelete: () => void;
  isSaving: boolean;
  isDeleting: boolean;
}

export const HoldingDetailModal: React.FC<HoldingDetailModalProps> = ({
  open,
  holding,
  accountName,
  sourceDescription,
  aliasInput,
  onAliasChange,
  quantityDeltaInput,
  onQuantityDeltaChange,
  quantityTargetInput,
  onQuantityTargetChange,
  quantityDeltaInvalid,
  quantityTargetInvalid,
  quantitySummary,
  tags,
  selectedTagIds,
  availableTags,
  isAddingTag,
  holdingTagsLoading,
  onToggleAddingTag,
  onSelectTag,
  onRemoveTag,
  syncingHoldingId,
  onManualSync,
  onClose,
  onSave,
  onDelete,
  isSaving,
  isDeleting,
}) => {
  if (!holding) {
    return null;
  }

  const subtitle = formatMarketWithSymbol(holding.market, holding.symbol);
  const selectedTags = selectedTagIds
    .map((tagId) => tags.find((tag) => tag.id === tagId))
    .filter((tag): tag is Tag => Boolean(tag));

  return (
    <Modal
      open={open}
      title={
        holding.alias && holding.alias.trim().length > 0
          ? holding.alias
          : holding.name
      }
      subtitle={subtitle}
      onClose={onClose}
      actions={
        <ButtonGroup>
          <Button variant="primary" onClick={onSave} disabled={isSaving}>
            {isSaving ? '저장 중...' : '저장'}
          </Button>
          <Button
            variant="danger"
            onClick={onDelete}
            disabled={isDeleting || holding.source !== 'MANUAL'}
          >
            {isDeleting ? '삭제 중...' : '삭제'}
          </Button>
        </ButtonGroup>
      }
    >
      <ModalSection>
        <Field>
          <FieldLabel htmlFor="holding-alias">표시 이름</FieldLabel>
          <TextInput
            id="holding-alias"
            value={aliasInput}
            onChange={(event) => onAliasChange(event.target.value)}
            placeholder="별칭을 입력하세요"
          />
          <HelperText>
            별칭을 입력하면 목록에 표시되는 이름을 변경할 수 있습니다.
          </HelperText>
        </Field>
      </ModalSection>

      <ModalSection>
        <ModalRow>
          <InlineLabel>계좌</InlineLabel>
          <ValueBadge>{accountName}</ValueBadge>
          <InlineLabel>동기화 방식</InlineLabel>
          <ValueBadge>{sourceDescription}</ValueBadge>
        </ModalRow>
      </ModalSection>

      <ModalSection>
        <ModalRow>
          <InlineLabel>수량 증감</InlineLabel>
          <QuantityInput
            value={quantityDeltaInput}
            onChange={(event) => onQuantityDeltaChange(event.target.value)}
            placeholder="+100"
            $invalid={quantityDeltaInvalid}
          />
          <InlineLabel>목표 수량</InlineLabel>
          <QuantityInput
            value={quantityTargetInput}
            onChange={(event) => onQuantityTargetChange(event.target.value)}
            placeholder="5"
            $invalid={quantityTargetInvalid}
          />
        </ModalRow>
        <HelperText>{quantitySummary}</HelperText>
      </ModalSection>

      <ModalSection>
        <InlineLabel>태그</InlineLabel>
        <TagContainer>
          {holdingTagsLoading ? (
            <HelperText>태그를 불러오는 중...</HelperText>
          ) : selectedTags.length === 0 ? (
            <HelperText>선택된 태그가 없습니다.</HelperText>
          ) : (
            <TagList>
              {selectedTags.map((tag) => (
                <TagChip key={tag.id} color={tag.color}>
                  {tag.name}
                  <TagRemoveButton
                    type="button"
                    onClick={() => onRemoveTag(tag.id)}
                  >
                    ×
                  </TagRemoveButton>
                </TagChip>
              ))}
            </TagList>
          )}
        </TagContainer>
        <TagActions>
          {isAddingTag && availableTags.length > 0 ? (
            <select
              defaultValue=""
              onChange={(event) => {
                onSelectTag(event.target.value);
                event.currentTarget.value = '';
              }}
            >
              <option value="" disabled>
                태그 선택
              </option>
              {availableTags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            onClick={onToggleAddingTag}
            disabled={
              holdingTagsLoading || (!isAddingTag && availableTags.length === 0)
            }
          >
            {isAddingTag ? '닫기' : '태그 선택'}
          </Button>
        </TagActions>
        {!holdingTagsLoading &&
        availableTags.length === 0 &&
        tags.length > 0 ? (
          <HelperText>추가 가능한 태그가 없습니다.</HelperText>
        ) : null}
      </ModalSection>

      <ModalSection>
        <ModalRow>
          <InlineLabel>현재가</InlineLabel>
          <ValueBadge>
            {formatCurrencyValue(holding.currentPrice, holding.currency)}
          </ValueBadge>
          {holding.source === 'MANUAL' && holding.market ? (
            <IconButton
              variant="secondary"
              aria-label="현재가 동기화"
              onClick={(event) => onManualSync(holding, event)}
              disabled={syncingHoldingId === holding.id}
            >
              {syncingHoldingId === holding.id ? '···' : '↻'}
            </IconButton>
          ) : null}
          <InlineLabel>마지막 업데이트</InlineLabel>
          <ValueBadge>{formatLastUpdated(holding.lastUpdated)}</ValueBadge>
        </ModalRow>
      </ModalSection>
    </Modal>
  );
};
