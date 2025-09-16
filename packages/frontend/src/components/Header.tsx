import React from 'react';
import styled from 'styled-components';

const HeaderContainer = styled.header`
  background-color: ${props => props.theme.colors.primary};
  color: white;
  padding: ${props => props.theme.spacing.lg};
  box-shadow: ${props => props.theme.shadows.sm};
`;

const Title = styled.h1`
  margin: 0;
  font-size: ${props => props.theme.typography.fontSize.xl};
  font-weight: ${props => props.theme.typography.fontWeight.bold};
`;

const Subtitle = styled.p`
  margin: ${props => props.theme.spacing.xs} 0 0 0;
  opacity: 0.9;
  font-size: ${props => props.theme.typography.fontSize.sm};
`;

export const Header: React.FC = () => {
  return (
    <HeaderContainer>
      <Title>리밸런싱 헬퍼</Title>
      <Subtitle>포트폴리오 리밸런싱을 위한 조회 전용 도구</Subtitle>
    </HeaderContainer>
  );
};