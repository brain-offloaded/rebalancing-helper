# 전사적 Decimal 전환 실행 계획

## 1. 준비 단계

1. **기술 스택 정리**
   - 백엔드에서 사용할 Decimal 라이브러리(예: `decimal.js`)와 Prisma `Decimal` 간 변환 규칙을 정의한다.
   - 프론트엔드에서도 동일한 라이브러리를 사용할 수 있도록 패키지 의존성을 확인한다.
   - 공통 모듈 배치 경로로 `packages/common`을 생성하거나 기존 패키지를 확장하기 위한 디렉터리 구조를 검토한다.
2. **테스트 및 코드젠 현황 파악**
   - `packages/backend`와 `packages/frontend`의 테스트 커버리지와 실행 방식을 확인한다.
   - GraphQL 코드 생성(`packages/frontend/codegen.ts`, `packages/backend/codegen.ts` 존재 시)을 분석해 Decimal 스칼라 매핑 포인트를 찾는다.
3. **기존 Decimal/number 사용처 조사**
   - `rg -g"*.ts" "toNumber\(" packages` 명령으로 Prisma Decimal을 number로 변환하는 지점을 수집한다.
   - `rg -g"*.ts" "parseFloat" packages`로 프론트엔드의 부동소수점 사용 지점을 목록화한다.
   - 조사 결과를 기반으로 우선순위를 정하고, 변경 영향 범위를 산정한다.

## 2. 공통 Decimal 유틸리티 도입

1. **패키지 생성**
   - `packages/common`이 없다면 `pnpm` 워크스페이스에 추가하고 기본 `package.json`을 구성한다.
   - `decimal.js-light` 또는 선택한 Decimal 라이브러리를 의존성으로 추가한다.
2. **핵심 유틸 구현**
   - `packages/common/src/decimal.ts`(또는 유사 경로)에 다음을 포함한 래퍼를 작성한다:
     - Decimal 인스턴스 생성/검증 헬퍼 (`createDecimal`, `isDecimal`).
     - 문자열/숫자/Prisma Decimal 간 변환 함수 (`fromPrismaDecimal`, `toPrismaDecimal`, `toPlainString`).
     - 덧셈·뺄셈·곱셈·나눗셈·비교 등 연산 헬퍼.
     - 반올림·포맷팅 전략(소수 자릿수, 컷오프 규칙)을 정의하는 옵션.
3. **테스트 작성**
   - `packages/common/src/__tests__/decimal.spec.ts`에 각 연산과 변환의 정확도를 검증하는 테스트를 작성한다.
   - 극단값(아주 큰 수, 매우 작은 소수, 반복 소수) 및 반올림 정책을 포함한다.

## 3. 백엔드 인프라 정비

1. **Prisma 어댑터 구축**
   - `packages/backend/src/common/prisma-decimal.adapter.ts`를 작성하여 Prisma `Decimal`과 공통 Decimal 간 변환을 담당한다.
   - 서비스 계층에서 Prisma 모델을 반환하거나 수신할 때 이 어댑터를 사용하도록 한다.
2. **GraphQL Decimal Scalar 도입**
   - `packages/backend/src/common/scalars/decimal.scalar.ts`에 GraphQL 커스텀 스칼라를 구현한다.
   - Apollo/Nest GraphQL 모듈에 스칼라를 등록하고, 코드젠 설정에 스칼라 매핑을 추가한다.
3. **DTO 및 엔티티 업데이트**
   - `packages/backend/src/holdings` 및 `packages/backend/src/brokerage`의 엔티티와 DTO에서 `@Field(() => Number)`를 `DecimalScalar`로 변경한다.
   - class-validator 사용 시 `@IsDecimal` 또는 커스텀 데코레이터를 도입해 검증한다.
4. **서비스 레이어 수정**
   - `HoldingsService`, `BrokerageService` 등에서 `.toNumber()` 호출을 제거하고 공통 Decimal 유틸을 사용한다.
   - 금액/수량 계산 로직을 Decimal 연산으로 교체한다.
5. **테스트 및 마이그레이션**
   - 해당 서비스의 단위 테스트와 통합 테스트를 Decimal 기반으로 수정하고 통과시킨다.
   - 스냅샷이 존재한다면 Decimal 문자열 표현에 맞춰 업데이트한다.

## 4. 백엔드 도메인 로직 전환

1. **재밸런싱 서비스**
   - `packages/backend/src/rebalancing/rebalancing.service.ts`의 합계, 비율, 추천 금액 계산을 Decimal로 전환한다.
   - 반복 계산이나 누적 합산 시 Decimal 헬퍼를 사용해 오차를 방지한다.
2. **환율 및 시세 서비스**
   - `packages/backend/src/yahoo/currency-conversion.service.ts`와 관련 캐시가 Decimal 값을 저장하도록 변경한다.
   - `market-data.service.ts`, `bithumb.service.ts`, `naver-gold.service.ts` 등 시세 수집 모듈에서 문자열을 Decimal로 파싱해 전달한다.
3. **비즈니스 규칙 검증**
   - 변경된 로직에 맞춰 단위 테스트를 업데이트하고, Decimal 비교를 위한 커스텀 matcher 또는 헬퍼를 도입한다.
   - 통합 테스트나 e2e 테스트가 있다면 실제 시나리오 기반으로 정밀도를 검증한다.

## 5. 프론트엔드 준비 작업

1. **GraphQL 코드 생성 설정 변경**
   - `packages/frontend/codegen.ts`에 새 Decimal 스칼라 매핑을 추가해 문자열 또는 공통 Decimal 타입을 사용하도록 한다.
   - 코드젠을 재실행하여 생성된 타입을 확인한다.
2. **상태 및 타입 정의 업데이트**
   - `packages/frontend/src/components/holdings/types.ts` 등의 도메인 타입을 Decimal 기반으로 교체한다.
   - 전역 상태 관리(store, context 등)에서 Decimal을 기본 값으로 사용하도록 수정한다.
3. **유틸리티 정비**
   - 포맷팅, 반올림, 입력 검증을 담당하는 유틸리티 함수들을 공통 모듈을 사용하도록 리팩터링한다.
   - 필요하다면 프론트엔드 전용 포맷팅 헬퍼를 `packages/frontend/src/utils/decimal-format.ts` 등에 추가한다.

## 6. 프론트엔드 UI 전환

1. **입력 폼 개선**
   - `ManualHoldingForm` 등 사용자 입력을 받는 컴포넌트에서 `parseFloat`, `Number` 사용을 제거하고 Decimal 유틸을 사용한다.
   - 입력 유효성 검사와 에러 메시지를 Decimal 기준으로 재작성한다.
2. **표시 로직 업데이트**
   - 보유 자산 목록, 재밸런싱 뷰 등 금액/수량을 노출하는 컴포넌트에서 Decimal을 문자열로 포맷팅 후 표시한다.
   - `Intl.NumberFormat` 사용 시 문자열 변환을 선행하고, 소수 자릿수 정책을 공통화한다.
3. **상호작용 검증**
   - 주요 사용자 플로우(보유 입력, 재밸런싱 추천 확인 등)를 수동 테스트하거나 Cypress 등 e2e 테스트를 Decimal 기반으로 수정 후 실행한다.

## 7. 빌드 및 배포 파이프라인 점검

1. **타입 체크 및 린트**
   - `pnpm lint`, `pnpm test`, `pnpm build` 등 워크플로우를 실행해 Decimal 전환 후 문제를 확인한다.
2. **CI/CD 설정 검증**
   - CI 파이프라인에서 Decimal 라이브러리 및 공통 패키지가 정상적으로 설치·빌드되는지 확인한다.
   - 필요한 환경 변수나 설정 파일 변경 사항을 문서화한다.

## 8. 문서화 및 인수인계

1. **개발자 가이드 업데이트**
   - `docs` 디렉터리의 기존 문서에 Decimal 사용 지침을 추가하고, 새로운 유틸 사용법을 소개한다.
2. **PR 체크리스트 작성**
   - Decimal 관련 변경 시 검토해야 할 항목(스칼라 매핑, 타입 업데이트, 테스트)을 체크리스트로 만든다.
