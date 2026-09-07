import { logger } from '@/lib/logger';
import { handleSatsTerminalError } from '@/lib/satsTerminalError';

describe('handleSatsTerminalError', () => {
  it('maps quote expired to 410', () => {
    const res = handleSatsTerminalError(new Error('Quote expired for id')); // message contains
    expect(res).toBeTruthy();

    expect(res?.status).toBe(410);
  });

  it('maps rate limit to 429', () => {
    const res = handleSatsTerminalError(new Error('Rate limit exceeded'));
    expect(res).toBeTruthy();

    expect(res?.status).toBe(429);
  });

  it('maps unexpected token to 503', () => {
    const res = handleSatsTerminalError(new Error('Unexpected token < in JSON'));
    expect(res).toBeTruthy();

    expect(res?.status).toBe(503);
  });

  it('returns null for unknown errors', () => {
    const res = handleSatsTerminalError(new Error('Other'));
    expect(res).toBeNull();
  });

  it('keeps internal SDK errors in server logs and out of the response', async () => {
    const log = jest.spyOn(logger, 'error').mockImplementation(() => {});
    const error = new ReferenceError('apiKey is not defined');
    try {
      const response = handleSatsTerminalError(error);
      expect(log).toHaveBeenCalledWith(
        'API Error in SatsTerminal',
        expect.objectContaining({ error: error.message, stack: error.stack }),
        'API',
      );
      expect(response?.status).toBe(500);
      expect(await response?.json()).toEqual({
        success: false,
        error: { message: 'External service error. Please try again later.' },
      });
    } finally {
      log.mockRestore();
    }
  });
});
