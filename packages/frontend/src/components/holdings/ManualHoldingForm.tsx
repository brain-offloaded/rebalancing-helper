import { Button } from '../ui/Button';
import type { ManualAccount, MarketOption } from './types';
import {
  ManualForm,
  ManualFormGroup,
  ManualInput,
  ManualSelect,
} from './styles';

interface ManualHoldingFormProps {
  accounts: ManualAccount[];
  markets: MarketOption[];
  marketLoading: boolean;
  accountLoading: boolean;
  accountId: string;
  market: string;
  symbol: string;
  quantity: string;
  submitting: boolean;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onAccountChange: (value: string) => void;
  onMarketChange: (value: string) => void;
  onSymbolChange: (value: string) => void;
  onQuantityChange: (value: string) => void;
}

export const ManualHoldingForm: React.FC<ManualHoldingFormProps> = ({
  accounts,
  markets,
  marketLoading,
  accountLoading,
  accountId,
  market,
  symbol,
  quantity,
  submitting,
  onSubmit,
  onAccountChange,
  onMarketChange,
  onSymbolChange,
  onQuantityChange,
}) => (
  <ManualForm onSubmit={onSubmit}>
    <ManualFormGroup>
      계좌
      <ManualSelect
        value={accountId}
        onChange={(event) => onAccountChange(event.target.value)}
        disabled={accountLoading || accounts.length === 0}
      >
        <option value="" disabled>
          {accountLoading
            ? '계좌 불러오는 중...'
            : '수동 입력 계정을 먼저 생성하세요'}
        </option>
        {accounts.map((account) => (
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
        value={market}
        onChange={(event) => onMarketChange(event.target.value)}
        disabled={marketLoading || markets.length === 0}
      >
        <option value="" disabled>
          {marketLoading ? '시장 불러오는 중...' : '시장 선택'}
        </option>
        {markets.map((item) => (
          <option key={item.id} value={item.code}>
            {`${item.displayName} (${item.code})`}
          </option>
        ))}
      </ManualSelect>
    </ManualFormGroup>

    <ManualFormGroup>
      종목 코드
      <ManualInput
        value={symbol}
        onChange={(event) => onSymbolChange(event.target.value)}
        placeholder="예: VOO"
      />
    </ManualFormGroup>

    <ManualFormGroup>
      수량
      <ManualInput
        type="number"
        min="0"
        step="0.01"
        value={quantity}
        onChange={(event) => onQuantityChange(event.target.value)}
        placeholder="예: 1"
      />
    </ManualFormGroup>

    <Button
      type="submit"
      variant="primary"
      disabled={
        submitting ||
        !market ||
        !accountId ||
        accountLoading ||
        Number(quantity) < 0
      }
    >
      수동 추가
    </Button>
  </ManualForm>
);
