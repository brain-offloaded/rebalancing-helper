import React, { useState } from 'react';
import { BrokerageAccounts } from './BrokerageAccounts';
import { Brokers } from './Brokers';
import { Holdings } from './Holdings';
import { RebalancingGroups } from './RebalancingGroups';
import { Tags } from './Tags';
import { Section } from './ui/Layout';
import { TabButton, TabList, TabPanel, Tabs } from './ui/Tabs';

type TabType = 'accounts' | 'brokers' | 'holdings' | 'tags' | 'rebalancing';

export const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('accounts');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'accounts':
        return <BrokerageAccounts />;
      case 'brokers':
        return <Brokers />;
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
    <Section>
      <Tabs>
        <TabList>
          <TabButton
            $active={activeTab === 'accounts'}
            onClick={() => setActiveTab('accounts')}
          >
            증권사 계정
          </TabButton>
          <TabButton
            $active={activeTab === 'brokers'}
            onClick={() => setActiveTab('brokers')}
          >
            증권사 정보
          </TabButton>
          <TabButton
            $active={activeTab === 'holdings'}
            onClick={() => setActiveTab('holdings')}
          >
            보유 종목
          </TabButton>
          <TabButton
            $active={activeTab === 'tags'}
            onClick={() => setActiveTab('tags')}
          >
            태그 관리
          </TabButton>
          <TabButton
            $active={activeTab === 'rebalancing'}
            onClick={() => setActiveTab('rebalancing')}
          >
            리밸런싱
          </TabButton>
        </TabList>
        <TabPanel>{renderTabContent()}</TabPanel>
      </Tabs>
    </Section>
  );
};
