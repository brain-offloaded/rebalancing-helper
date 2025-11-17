# Repository Guidelines

## Project Structure & Module Organization
`packages/`은 `backend`(NestJS GraphQL API), `frontend`(React SPA), `common`(공유 유틸/타입)으로 나뉘며, 각각은 자체 `package.json`과 `tsconfig` 세트를 가진 워크스페이스입니다. 루트 `docs/`와 `turbo.json`이 공통 파이프라인·문서의 기준을 제공하며, GraphQL 산출물은 `packages/backend/src`에서 만들어져 `packages/frontend`에서 재사용합니다.

## Build, Test, and Development Commands
- `pnpm install` : 전체 워크스페이스 의존성 설치.
- `pnpm dev`, `pnpm dev:backend`, `pnpm dev:frontend` : 각각 Turbo 병렬 개발 서버, 백엔드 Nest watch, 프론트엔드 Vite를 실행합니다.
- `pnpm build`, `pnpm build:backend`, `pnpm build:frontend` : 각 패키지를 컴파일하고 Turbo 파이프라인 전체 빌드를 실행합니다.
- `pnpm lint`, `pnpm lint:fix` : ESLint 규칙을 적용하며 수정 사항은 `--fix`로 바로잡습니다.
- `pnpm test`, `pnpm test:cov` : 루트에서 Turbo를 통해 Jest/Vitest 테스트와 커버리지를 실행합니다.
- `pnpm prisma:generate`, `pnpm gql:all`, `pnpm lint:fix`, `pnpm build`, `pnpm test:cov` : PR 전 반드시 순차 실행하여 Prisma 클라이언트, GraphQL 코드, 스타일, 빌드, 테스트 모두 검증합니다.

## Coding Style & Naming Conventions
TypeScript 기반 NestJS/React 모두에서 Prettier 기본(2칸 indent, 세미콜론 자동)과 ESLint 규칙을 따릅니다. 컴포넌트는 PascalCase, 훅·서비스는 camelCase, GraphQL 타입은 UpperCamelCase로 유지하고, 파일명은 `*.service.ts`, `*.resolver.ts`처럼 목적을 보여주는 접미사를 붙입니다. 공용 설정은 `packages/common`에 모으고, 상수명은 `UPPER_SNAKE_CASE`, 함수는 `camelCase`를 권장합니다.

## Testing Guidelines
백엔드는 Jest(coverage threshold branches 75%, other metrics 85%)로 `.spec.ts` 테스트를 작성하고 `Arrange-Act-Assert` 흐름을 지킵니다. 프론트엔드는 Vitest + Testing Library를 써서 컴포넌트 동작과 hooks를 검증하며, 테스트는 기능을 설명하는 자연어 제목으로 작성합니다. 테스트는 변경 전 항상 실패하는 상태를 만들고, 통과 여부를 확인한 뒤 구현·리팩터링합니다.

## Commit & Pull Request Guidelines
커밋 메시지는 짧고 현재 시제로 변경 의도를 한글로 기술하며(예: `버그 수정`, `UI 개선`), PR에는 요약, 진행한 명령(`pnpm prisma:generate` 등), 관련 이슈/스크린샷을 명시합니다. 리뷰어가 재현할 수 있도록 `pnpm dev` 또는 `pnpm test:cov` 실행 결과도 기술합니다. PR은 자동화된 파이프라인을 통과한 상태로 유지하고, 필요한 경우 마이그레이션·GraphQL 산출물을 커밋합니다.

## Security & Configuration Tips
API 키와 DB 자격 증명은 `.env` 예시를 참고해 로컬에서만 관리하며, 산출물(`packages/backend/generated.graphql`)은 `pnpm gql:all`로 생성합니다. Prisma 마이그레이션은 `pnpm prisma:migrate`로 적용하고 `.env`에 반영된 후 결과를 커밋하세요.
