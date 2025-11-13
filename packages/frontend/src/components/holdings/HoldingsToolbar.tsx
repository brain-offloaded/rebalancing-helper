import styled from 'styled-components';
import { Button } from '../ui/Button';
import { Field, FieldLabel, Select } from '../ui/FormControls';
import type { HoldingSortMode } from './types';

const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.md};
  align-items: flex-end;
  justify-content: space-between;
`;

const PrimaryActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
`;

const SortField = styled(Field)`
  margin: 0;
  min-width: 220px;
`;

interface HoldingsToolbarProps {
  manualHoldingsCount: number;
  syncingAll: boolean;
  onSyncAll: () => void;
  sortMode: HoldingSortMode;
  onSortModeChange: (mode: HoldingSortMode) => void;
}

export const HoldingsToolbar: React.FC<HoldingsToolbarProps> = ({
  manualHoldingsCount,
  syncingAll,
  onSyncAll,
  sortMode,
  onSortModeChange,
}) => (
  <Toolbar>
    <PrimaryActions>
      <Button
        variant="secondary"
        type="button"
        onClick={onSyncAll}
        disabled={syncingAll || manualHoldingsCount === 0}
      >
        {syncingAll ? '현재가 동기화 중...' : '수동 종목 현재가 전체 동기화'}
      </Button>
    </PrimaryActions>
    <SortField>
      <FieldLabel htmlFor="holding-sort-select">정렬 기준</FieldLabel>
      <Select
        id="holding-sort-select"
        value={sortMode}
        onChange={(event) =>
          onSortModeChange(event.target.value as HoldingSortMode)
        }
      >
        <option value="default">등록 순서</option>
        <option value="account">계좌 기준 정렬</option>
      </Select>
    </SortField>
  </Toolbar>
);
