import styled from 'styled-components';

export const PageContainer = styled.div`
  padding: ${({ theme }) => theme?.spacing?.lg ?? '24px'};
`;

export const HeaderBar = styled.header`
  background-color: #0f172a;
  color: #ffffff;
  padding: ${({ theme }) => theme?.spacing?.xl ?? '32px'};
  margin-bottom: ${({ theme }) => theme?.spacing?.xl ?? '32px'};
`;

export const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme?.spacing?.md ?? '16px'};
`;

export const HeaderTitle = styled.h1`
  margin: 0;
`;

export const HeaderSubtitle = styled.p`
  margin: 0;
  color: rgba(255, 255, 255, 0.75);
`;

export const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme?.spacing?.md ?? '16px'};
  margin-bottom: ${({ theme }) => theme?.spacing?.xl ?? '32px'};
`;

export const SectionHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme?.spacing?.xs ?? '4px'};
`;

export const SectionTitle = styled.h2`
  margin: 0;
`;

export const SectionDescription = styled.p`
  margin: 0;
  color: ${({ theme }) => theme?.colors?.textLight ?? '#6c757d'};
`;

export const Grid = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'minWidth',
})<{ minWidth?: string }>`
  display: grid;
  grid-template-columns: repeat(
    auto-fill,
    minmax(${({ minWidth = '300px' }) => minWidth}, 1fr)
  );
  gap: ${({ theme }) => theme?.spacing?.md ?? '16px'};
`;
