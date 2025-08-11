import { api } from '../helpers/apiHelpers';

describe('Integration: Security', () => {
  it('should include security headers from helmet', async () => {
    const res = await api().get('/health');
    expect(res.status).toBe(200);
    // A few typical Helmet headers (subset; exact header names may vary with versions)
    expect(res.headers).toEqual(
      expect.objectContaining({
        'x-dns-prefetch-control': expect.any(String),
        'x-frame-options': expect.any(String),
        'x-download-options': expect.any(String),
      })
    );
  });

  it('should enforce CORS headers', async () => {
    const res = await api().get('/health');
    expect(res.headers).toEqual(
      expect.objectContaining({ 'access-control-allow-origin': '*' })
    );
  });
});
