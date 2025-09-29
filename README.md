# rebalancing-helper
# 리밸런싱 헬퍼 (Rebalancing Helper)

포트폴리오 리밸런싱을 위한 조회 전용 웹 애플리케이션입니다.

## 🎯 주요 기능

### 1. 증권사 API 연동
- 다양한 증권사의 REST API 키를 통한 보유 종목 조회
- 실시간 보유 종목 및 평가금액 업데이트
- 안전한 API 키 관리 (로컬 환경에서만 사용)

### 2. 종목 태깅 시스템
- 보유 종목에 태그 설정 (예: S&P 500 ETF, 국제 주식, 채권 등)
- 색상별 태그 관리
- 동일한 자산군 ETF를 하나로 묶어서 관리

### 3. 리밸런싱 그룹 관리
- 태그별로 자산 배분 그룹 생성
- 현재 보유 비율 vs 목표 비율 시각화
- 차트를 통한 직관적인 배분 현황 확인

### 4. 투자 추천 시스템
- 목표 비율 달성을 위한 투자 금액 계산
- 태그별 추천 투자 금액 및 비율 제시
- 기존 보유 종목 기반 투자 제안

## 🏗️ 기술 스택

### Backend (NestJS)
- **Framework**: NestJS with TypeScript
- **API**: GraphQL (Code First)
  - schema.graphql 파일은 반드시 `pnpm gql:all` 으로 자동 생성합니다. 절대 수동 수정하지 않습니다.
- **Architecture**: 모듈형 구조 (Brokerage, Holdings, Tags, Rebalancing)

### Frontend (React)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Styled Components
- **GraphQL Client**: Apollo Client
- **Charts**: Recharts

### 패키지 구조
```
rebalancing-helper/
├── packages/
│   ├── backend/          # NestJS GraphQL API
│   └── frontend/         # React SPA
├── package.json          # 워크스페이스 설정
└── README.md
```

## 🚀 실행 방법

### 전체 애플리케이션 실행
```bash
pnpm install
pnpm dev
```

### 개별 실행
```bash
# 백엔드만 실행
pnpm dev:backend

# 프론트엔드만 실행
pnpm dev:frontend
```

### 빌드
```bash
pnpm build
```

### 테스트 및 커버리지
```bash
# 단위 테스트 실행
pnpm test

# 백엔드 단위 테스트 커버리지 리포트 생성
pnpm --filter backend test:cov

# 프론트엔드 단위 테스트 실행
pnpm --filter frontend test

# 프론트엔드 단위 테스트 커버리지 리포트 생성
pnpm --filter frontend test:cov

# 모든 워크스페이스 커버리지 리포트 실행
pnpm test:cov
```

### 모노레포 작업 흐름

- **Turbo**를 사용해 공통 스크립트를 실행합니다.
- `pnpm dev`는 `turbo run dev --parallel`을 통해 백엔드와 프론트엔드를 동시에 실행합니다.
- `pnpm lint`, `pnpm build`, `pnpm test`는 각 패키지의 스크립트를 Turbo 파이프라인에서 일괄 실행합니다.

## 📡 API 엔드포인트

- **Frontend**: http://localhost:5173
- **Backend GraphQL**: http://localhost:3000/graphql
- **GraphQL Playground**: http://localhost:3000/graphql

## 🔧 주요 GraphQL 스키마

### 증권사 계정 관리
```graphql
type BrokerageAccount {
  id: ID!
  name: String!
  brokerName: String!
  description: String
  isActive: Boolean!
}

type BrokerageHolding {
  id: ID!
  symbol: String!
  name: String!
  quantity: Float!
  currentPrice: Float!
  marketValue: Float!
  currency: String!
}
```

### 태그 시스템
```graphql
type Tag {
  id: ID!
  name: String!
  description: String
  color: String!
}
```

### 리밸런싱 그룹
```graphql
type RebalancingGroup {
  id: ID!
  name: String!
  description: String
  tagIds: [String!]!
}

type RebalancingAnalysis {
  groupId: ID!
  groupName: String!
  totalValue: Float!
  allocations: [TagAllocation!]!
}
```

## ⚠️ 중요 사항

- **조회 전용**: 매수/매도 기능 없음, 순수 조회 및 분석만 제공
- **로컬 사용**: localhost에서만 실행되는 개인용 도구
- **데이터 보안**: API 키는 로컬에만 저장, 외부 전송 없음
- **Mock 데이터**: 현재 데모용 Mock 데이터 사용 (실제 API 연동 가능)

## 🎨 UI 미리보기

![Rebalancing Helper Frontend](https://github.com/user-attachments/assets/b424f62d-801e-49d0-8058-24c20bc329e4)

현재 기본 UI가 구현되어 있으며, 향후 styled-components를 통한 완전한 UI를 제공할 예정입니다.

## 📋 향후 개발 계획

- [ ] 실제 증권사 API 연동 구현
- [ ] 완전한 UI/UX 구현 (styled-components)
- [ ] 데이터 영속성 (데이터베이스 연동)
- [ ] 고급 차트 및 분석 기능
- [ ] 알림 및 리밸런싱 스케줄 기능
