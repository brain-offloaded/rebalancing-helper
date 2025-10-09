import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('react-dom/client', () => {
  const render = vi.fn();
  return {
    createRoot: vi.fn(() => ({ render })),
    __renderMock: render,
  };
});

describe('main entry point', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>';
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('React 애플리케이션을 루트에 렌더링한다', { timeout: 15000 }, async () => {
    const { createRoot, __renderMock } = await import('react-dom/client');

    await import('./main');

    expect(createRoot).toHaveBeenCalledWith(document.getElementById('root'));
    expect(__renderMock).toHaveBeenCalledTimes(1);
  });
});
