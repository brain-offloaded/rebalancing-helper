import { describe, expect, it, vi } from 'vitest';
import { forTestFunction } from './index';

describe('forTestFunction', () => {
  it("logs 'success' once", () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    forTestFunction();

    expect(spy).toHaveBeenCalledWith('success');
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });
});
