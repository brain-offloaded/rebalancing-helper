import type { FC } from 'react';
import { Button } from '../ui/Button';
import { TextInput } from '../ui/FormControls';
import { Table, TableCell, TableHeadCell, TableRow } from '../ui/Table';
import { formatMarketWithSymbol } from './formatters';
import { CellContent, PrimaryText, SecondaryText } from './styles';

export interface SecurityAliasRow {
  key: string;
  market: string | null;
  symbol: string;
  name: string;
  holdingCount: number;
  savedAlias: string;
}

interface SecurityAliasPanelProps {
  rows: SecurityAliasRow[];
  aliasInputs: Record<string, string>;
  savingKey: string | null;
  onAliasChange: (key: string, value: string) => void;
  onAliasSave: (row: SecurityAliasRow) => void;
}

export const SecurityAliasPanel: FC<SecurityAliasPanelProps> = ({
  rows,
  aliasInputs,
  savingKey,
  onAliasChange,
  onAliasSave,
}) => (
  <Table>
    <thead>
      <tr>
        <TableHeadCell>종목</TableHeadCell>
        <TableHeadCell>현재 표시명</TableHeadCell>
        <TableHeadCell>보유 행</TableHeadCell>
        <TableHeadCell>표시 이름</TableHeadCell>
        <TableHeadCell>저장</TableHeadCell>
      </tr>
    </thead>
    <tbody>
      {rows.length === 0 ? (
        <tr>
          <TableCell colSpan={5}>관리할 보유 종목이 없습니다.</TableCell>
        </tr>
      ) : (
        rows.map((row) => {
          const aliasInput = aliasInputs[row.key] ?? row.savedAlias;
          const trimmedInput = aliasInput.trim();
          const changed = trimmedInput !== row.savedAlias;
          const displayName =
            row.savedAlias.length > 0 ? row.savedAlias : row.name;

          return (
            <TableRow key={row.key}>
              <TableCell>
                <CellContent>
                  <PrimaryText>{row.symbol}</PrimaryText>
                  <SecondaryText>
                    {formatMarketWithSymbol(row.market, row.symbol)}
                  </SecondaryText>
                </CellContent>
              </TableCell>
              <TableCell>
                <CellContent>
                  <PrimaryText>{displayName}</PrimaryText>
                  {displayName !== row.name ? (
                    <SecondaryText>{row.name}</SecondaryText>
                  ) : null}
                </CellContent>
              </TableCell>
              <TableCell>{row.holdingCount}</TableCell>
              <TableCell>
                <TextInput
                  aria-label={`${row.symbol} 종목 표시 이름`}
                  value={aliasInput}
                  placeholder={row.name}
                  onChange={(event) =>
                    onAliasChange(row.key, event.target.value)
                  }
                />
              </TableCell>
              <TableCell>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={!changed || savingKey === row.key}
                  onClick={() => onAliasSave(row)}
                >
                  {savingKey === row.key ? '저장 중...' : '저장'}
                </Button>
              </TableCell>
            </TableRow>
          );
        })
      )}
    </tbody>
  </Table>
);
