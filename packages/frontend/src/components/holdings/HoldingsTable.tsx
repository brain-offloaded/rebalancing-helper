import type { MouseEvent } from 'react';
import { IconButton } from '../ui/Button';
import { Table, TableCell, TableHeadCell, TableRow } from '../ui/Table';
import { TagBadge } from '../ui/Tag';
import {
  formatCurrencyValue,
  formatLastUpdated,
  formatQuantityValue,
} from './formatters';
import type { Holding, Tag } from './types';
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

interface HoldingsTableProps {
  rows: HoldingRowData[];
  syncingHoldingId: string | null;
  onRowClick: (holdingId: string) => void;
  onManualSync: (
    holding: Holding,
    event?: MouseEvent<HTMLButtonElement>,
  ) => void;
}

export const HoldingsTable: React.FC<HoldingsTableProps> = ({
  rows,
  syncingHoldingId,
  onRowClick,
  onManualSync,
}) => (
  <Table>
    <thead>
      <tr>
        <TableHeadCell>계좌</TableHeadCell>
        <TableHeadCell>종목</TableHeadCell>
        <TableHeadCell>수량</TableHeadCell>
        <TableHeadCell>현재가</TableHeadCell>
        <TableHeadCell>평가금액</TableHeadCell>
        <TableHeadCell>마지막 업데이트</TableHeadCell>
        <TableHeadCell>태그</TableHeadCell>
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
                    {formatLastUpdated(holding.lastUpdated)}
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
