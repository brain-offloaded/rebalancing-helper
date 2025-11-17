import type { MouseEvent } from 'react';
import styled from 'styled-components';
import { IconButton } from '../ui/Button';
import { Table, TableCell, TableHeadCell, TableRow } from '../ui/Table';
import { TagBadge } from '../ui/Tag';
import {
  formatCurrencyValue,
  formatLastUpdated,
  formatQuantityValue,
} from './formatters';
import type {
  Holding,
  HoldingSortConfig,
  HoldingSortField,
  Tag,
} from './types';
import {
  CellContent,
  PriceWrapper,
  PrimaryText,
  SecondaryText,
  TagContainer,
} from './styles';

export interface HoldingRowData {
  holding: Holding;
  accountName: string;
  sourceDescription: string;
  displayName: string;
  baseName: string;
  subtitle: string;
  tags: Tag[];
}

type TableColumn = {
  field: HoldingSortField;
  label: string;
};

const tableColumns: TableColumn[] = [
  { field: 'account', label: '계좌' },
  { field: 'displayName', label: '종목' },
  { field: 'quantity', label: '수량' },
  { field: 'currentPrice', label: '현재가' },
  { field: 'marketValue', label: '평가액' },
  { field: 'lastTradedAt', label: '최근 매매' },
  { field: 'tags', label: '태그' },
];

const SortableHeadCell = styled(TableHeadCell)<{ $active: boolean }>`
  background-color: ${({ theme, $active }) =>
    $active ? theme.colors.dark : theme.colors.primary};
  transition: background-color 0.2s ease;
`;

const SortButton = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.xs};
  width: 100%;
  border: none;
  background: transparent;
  color: ${({ $active }) =>
    $active ? '#ffffff' : 'rgba(255, 255, 255, 0.85)'};
  font: inherit;
  font-weight: ${({ theme, $active }) =>
    $active
      ? theme.typography.fontWeight.bold
      : theme.typography.fontWeight.semibold};
  cursor: pointer;
  white-space: nowrap;
`;

const SortIndicator = styled.span<{ $active: boolean }>`
  font-size: 0.75rem;
  opacity: ${({ $active }) => ($active ? 1 : 0.75)};
`;

interface HoldingsTableProps {
  rows: HoldingRowData[];
  syncingHoldingId: string | null;
  onRowClick: (holdingId: string) => void;
  onManualSync: (
    holding: Holding,
    event?: MouseEvent<HTMLButtonElement>,
  ) => void;
  sortConfig: HoldingSortConfig;
  onSortRequest: (field: HoldingSortField) => void;
}

export const HoldingsTable: React.FC<HoldingsTableProps> = ({
  rows,
  syncingHoldingId,
  onRowClick,
  onManualSync,
  sortConfig,
  onSortRequest,
}) => (
  <Table>
    <thead>
      <tr>
        {tableColumns.map(({ field, label }) => (
          <SortableHeadCell
            key={field}
            aria-sort={
              sortConfig.field === field
                ? sortConfig.direction === 'asc'
                  ? 'ascending'
                  : 'descending'
                : 'none'
            }
            $active={sortConfig.field === field}
          >
            <SortButton
              type="button"
              onClick={() => onSortRequest(field)}
              aria-label={`${label} 정렬`}
              aria-pressed={sortConfig.field === field}
              $active={sortConfig.field === field}
            >
              {label}
              <SortIndicator $active={sortConfig.field === field}>
                {sortConfig.field !== field
                  ? '↕'
                  : sortConfig.direction === 'asc'
                    ? '▲'
                    : '▼'}
              </SortIndicator>
            </SortButton>
          </SortableHeadCell>
        ))}
      </tr>
    </thead>
    <tbody>
      {rows.length === 0 ? (
        <tr>
          <TableCell colSpan={7}>등록된 보유 종목이 없습니다.</TableCell>
        </tr>
      ) : (
        rows.map(
          ({
            holding,
            accountName,
            sourceDescription,
            displayName,
            baseName,
            subtitle,
            tags,
          }) => (
            <TableRow key={holding.id} onClick={() => onRowClick(holding.id)}>
              <TableCell>
                <CellContent>
                  <PrimaryText>{accountName}</PrimaryText>
                  <SecondaryText>{sourceDescription}</SecondaryText>
                </CellContent>
              </TableCell>
              <TableCell>
                <CellContent>
                  <PrimaryText>{displayName}</PrimaryText>
                  {displayName !== baseName ? (
                    <>
                      <SecondaryText>{baseName}</SecondaryText>
                      <SecondaryText>{subtitle}</SecondaryText>
                    </>
                  ) : (
                    <SecondaryText>{subtitle}</SecondaryText>
                  )}
                </CellContent>
              </TableCell>
              <TableCell>{formatQuantityValue(holding.quantity)}</TableCell>
              <TableCell>
                <PriceWrapper>
                  <PrimaryText>
                    {formatCurrencyValue(
                      holding.currentPrice,
                      holding.currency,
                    )}
                  </PrimaryText>
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
                </PriceWrapper>
              </TableCell>
              <TableCell>
                {formatCurrencyValue(holding.marketValue, holding.currency)}
              </TableCell>
              <TableCell>
                <CellContent>
                  <PrimaryText>
                    {formatLastUpdated(holding.lastTradedAt)}
                  </PrimaryText>
                </CellContent>
              </TableCell>
              <TableCell>
                <TagContainer>
                  {tags.length === 0 ? (
                    <SecondaryText>태그 없음</SecondaryText>
                  ) : (
                    tags.map((tag) => (
                      <TagBadge
                        key={`${holding.id}-${tag.id}`}
                        color={tag.color}
                      >
                        {tag.name}
                      </TagBadge>
                    ))
                  )}
                </TagContainer>
              </TableCell>
            </TableRow>
          ),
        )
      )}
    </tbody>
  </Table>
);
