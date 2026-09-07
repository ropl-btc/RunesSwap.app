import { GET } from './route';

it('serves the curated list with caching and valid rune identifiers', async () => {
  const response = GET();
  expect(response.status).toBe(200);
  expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600');
  const { success, data } = await response.json();
  expect(success).toBe(true);
  expect(data.length).toBeGreaterThan(0);
  for (const rune of data) {
    expect(rune.token_id).toMatch(/^\d+:\d+$/);
    expect(new URL(rune.icon).protocol).toBe('https:');
  }
});
