const http = require('http');

function request(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? Buffer.from(JSON.stringify(body)) : null;
    const options = {
      hostname: '192.168.0.59',
      port: 8090,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': data.length } : {}),
        ...headers,
      },
      timeout: 5000,
    };
    const req = http.request(options, (res) => {
      let chunks = '';
      res.on('data', (c) => (chunks += c));
      res.on('end', () => {
        try {
          const json = chunks ? JSON.parse(chunks) : {};
          if (res.statusCode >= 200 && res.statusCode < 300) return resolve(json);
          reject(new Error('HTTP ' + res.statusCode + ': ' + chunks));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

(async () => {
  try {
    // Health
    const health = await request('GET', '/api/health');
    console.log('Health:', health);

    // Auth with users collection
    const auth = await request('POST', '/api/collections/users/auth-with-password', {
      identity: 'pjpcemerlang@gmail.com',
      password: '0122270775Sw!'
    });
    const token = auth?.token;
    if (!token) throw new Error('No token in auth response');
    console.log('Auth OK');

    // Fetch fees
    const fees = await request('GET', '/api/collections/fees/records?perPage=20&sort=category', null, {
      Authorization: 'Bearer ' + token,
    });
    console.log('Fees count:', fees?.items?.length ?? 0);
    console.log(JSON.stringify((fees?.items || []).map(f => ({ id: f.id, name: f.name, category: f.category, status: f.status })), null, 2));
  } catch (e) {
    console.error('Check failed:', e.message);
    process.exit(1);
  }
})();


