import styled from 'styled-components';
import { Button } from '../ui/Button';

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

interface HoldingsToolbarProps {
  manualHoldingsCount: number;
  syncingAll: boolean;
  onSyncAll: () => void;
}

export const HoldingsToolbar: React.FC<HoldingsToolbarProps> = ({
  manualHoldingsCount,
  syncingAll,
  onSyncAll,
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
  </Toolbar>
);
