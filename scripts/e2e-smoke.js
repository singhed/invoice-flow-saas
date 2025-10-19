/*
 Simple E2E smoke test that checks the API Gateway health endpoint.
 Requires API_URL env var like https://api.example.com
*/
(async () => {
  try {
    const base = process.env.API_URL;
    if (!base) {
      console.error('API_URL is not set');
      process.exit(1);
    }
    const url = base.endsWith('/') ? `${base}health` : `${base}/health`;
    const res = await fetch(url, { method: 'GET', redirect: 'follow' });
    if (!res.ok) {
      console.error(`Health check failed with status ${res.status}`);
      process.exit(1);
    }
    const data = await res.json().catch(() => ({}));
    if (!data || (data.status !== 'healthy' && data.status !== 'ok')) {
      console.error(`Unexpected health payload: ${JSON.stringify(data)}`);
      process.exit(1);
    }
    console.log('E2E smoke test passed:', data);
    process.exit(0);
  } catch (err) {
    console.error('E2E smoke test error:', err);
    process.exit(1);
  }
})();
