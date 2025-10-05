import { Button } from '../ui/Button';

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
  <div>
    <Button
      variant="secondary"
      type="button"
      onClick={onSyncAll}
      disabled={syncingAll || manualHoldingsCount === 0}
    >
      {syncingAll ? '현재가 동기화 중...' : '수동 종목 현재가 전체 동기화'}
    </Button>
  </div>
);
