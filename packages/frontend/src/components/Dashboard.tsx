import React, { useState } from 'react';
import styled from 'styled-components';
import { BrokerageAccounts } from './BrokerageAccounts';
import { Holdings } from './Holdings';
import { Tags } from './Tags';
import { RebalancingGroups } from './RebalancingGroups';

const DashboardContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: ${props => props.theme.spacing.lg};
`;

const TabContainer = styled.div`
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const TabList = styled.div`
  display: flex;
  border-bottom: 2px solid ${props => props.theme.colors.border};
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const Tab = styled.button<{ active: boolean }>`
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  font-size: ${props => props.theme.typography.fontSize.md};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  background-color: ${props => props.active ? props.theme.colors.primary : 'transparent'};
  color: ${props => props.active ? 'white' : props.theme.colors.text};
  border: none;
  border-radius: ${props => props.theme.borderRadius.sm} ${props => props.theme.borderRadius.sm} 0 0;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${props => props.active ? props.theme.colors.primary : props.theme.colors.light};
  }

  &:not(:last-child) {
    margin-right: ${props => props.theme.spacing.sm};
  }
`;

const TabContent = styled.div`
  min-height: 400px;
`;

type TabType = 'accounts' | 'holdings' | 'tags' | 'rebalancing';

export const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('accounts');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'accounts':
        return <BrokerageAccounts />;
      case 'holdings':
        return <Holdings />;
      case 'tags':
        return <Tags />;
      case 'rebalancing':
        return <RebalancingGroups />;
      default:
        return <BrokerageAccounts />;
    }
  };

  return (
    <DashboardContainer>
      <TabContainer>
        <TabList>
          <Tab
            active={activeTab === 'accounts'}
            onClick={() => setActiveTab('accounts')}
          >
            증권사 계정
          </Tab>
          <Tab
            active={activeTab === 'holdings'}
            onClick={() => setActiveTab('holdings')}
          >
            보유 종목
          </Tab>
          <Tab
            active={activeTab === 'tags'}
            onClick={() => setActiveTab('tags')}
          >
            태그 관리
          </Tab>
          <Tab
            active={activeTab === 'rebalancing'}
            onClick={() => setActiveTab('rebalancing')}
          >
            리밸런싱
          </Tab>
        </TabList>
        <TabContent>
          {renderTabContent()}
        </TabContent>
      </TabContainer>
    </DashboardContainer>
  );
};