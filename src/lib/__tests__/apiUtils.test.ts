import { z } from 'zod';
import { fail, ok } from '@/lib/apiResponse';
import { handleApiError, validateRequest } from '@/lib/apiUtils';

it('returns standard JSON with the requested HTTP status', async () => {
  const response = ok({ id: '840000:3' }, 201);
  expect(response.status).toBe(201);
  expect(response.headers.get('content-type')).toContain('application/json');
  expect(await response.json()).toEqual({ success: true, data: { id: '840000:3' } });
  const error = fail('Invalid amount', { status: 400, code: 'INVALID_AMOUNT' });
  expect(error.status).toBe(400);
  expect(await error.json()).toEqual({
    success: false,
    error: { message: 'Invalid amount', code: 'INVALID_AMOUNT' },
  });
});

it('rejects malformed JSON and invalid financial input before calling the API', async () => {
  const schema = z.object({ amount: z.number().positive() });
  for (const body of ['{', '{"amount":-1}', '{"amount":"one"}']) {
    const result = await validateRequest(
      new Request('https://example.com', { method: 'POST', body }),
      schema,
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errorResponse.status).toBe(400);
      expect((await result.errorResponse.json()).success).toBe(false);
    }
  }
});

it('parses validated request bodies and query parameters', async () => {
  expect(
    await validateRequest(
      new Request('https://example.com', { method: 'POST', body: '{"amount":1}' }),
      z.object({ amount: z.number() }),
    ),
  ).toEqual({ success: true, data: { amount: 1 } });
  expect(
    await validateRequest(
      new Request('https://example.com?limit=5'),
      z.object({ limit: z.coerce.number() }),
      'query',
    ),
  ).toEqual({ success: true, data: { limit: 5 } });
});

it('preserves upstream error status and diagnostic details', () => {
  expect(handleApiError({ status: 404 })).toEqual({ message: 'Resource not found', status: 404 });
  expect(handleApiError(new Error('Failed'))).toEqual({
    message: 'Failed',
    status: 500,
    details: expect.stringContaining('Error: Failed'),
  });
});
