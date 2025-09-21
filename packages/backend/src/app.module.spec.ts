import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import {
  createGraphqlContext,
  GraphqlContextFactoryArgs,
  REQUEST_ID_HEADER,
} from './app.module';

jest.mock('node:crypto', () => ({
  randomUUID: jest.fn(),
}));

const createArgs = (
  overrides: Partial<GraphqlContextFactoryArgs['req']> = {},
) => {
  const req = {
    headers: {},
    ...overrides,
  } as Request;
  const res = {} as Response;
  return { req, res } satisfies GraphqlContextFactoryArgs;
};

describe('createGraphqlContext', () => {
  const randomUuidMock = randomUUID as jest.Mock;

  beforeEach(() => {
    randomUuidMock.mockReset().mockReturnValue('generated-uuid');
  });

  it('요청 헤더에 x-request-id가 있으면 그대로 사용한다', () => {
    const args = createArgs({ headers: { [REQUEST_ID_HEADER]: 'custom-id' } });

    const context = createGraphqlContext(args);

    expect(context.requestId).toBe('custom-id');
    expect(randomUuidMock).not.toHaveBeenCalled();
  });

  it('헤더가 배열이면 첫 번째 값을 사용한다', () => {
    const args = createArgs({
      headers: { [REQUEST_ID_HEADER]: ['id-1', 'id-2'] },
    });

    const context = createGraphqlContext(args);

    expect(context.requestId).toBe('id-1');
    expect(randomUuidMock).not.toHaveBeenCalled();
  });

  it('헤더가 없거나 비어 있으면 UUID를 생성한다', () => {
    const args = createArgs();

    const context = createGraphqlContext(args);

    expect(context.requestId).toBe('generated-uuid');
    expect(randomUuidMock).toHaveBeenCalledTimes(1);
  });

  it('비어 있는 문자열이면 UUID를 생성한다', () => {
    const args = createArgs({ headers: { [REQUEST_ID_HEADER]: '' } });

    const context = createGraphqlContext(args);

    expect(context.requestId).toBe('generated-uuid');
  });

  it('초기 사용자 정보는 null로 설정한다', () => {
    const args = createArgs();

    const context = createGraphqlContext(args);

    expect(context.user).toBeNull();
  });
});
