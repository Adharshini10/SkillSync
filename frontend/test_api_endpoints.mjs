const BACKEND_BASE = 'http://localhost:8080/api';

async function testBackendAuth() {
  console.log('Testing Spring Boot Auth APIs directly...');
  const timestamp = Date.now();
  const testUser = {
    name: `Direct Student ${timestamp}`,
    email: `direct_${timestamp}@example.com`,
    password: 'Password123!'
  };

  // 1. Check /api/test
  const testRes = await fetch(`${BACKEND_BASE}/test`);
  const testText = await testRes.text();
  console.log(`GET /api/test -> ${testRes.status}: ${testText.trim()}`);
  if (testRes.status !== 200) throw new Error('GET /api/test failed');

  // 2. Register
  const regRes = await fetch(`${BACKEND_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testUser)
  });
  const regData = await regRes.json();
  console.log(`POST /api/auth/register -> ${regRes.status}:`, regData);
  if (regRes.status !== 201) throw new Error('Registration failed');

  // 3. Duplicate Register
  const dupRes = await fetch(`${BACKEND_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testUser)
  });
  console.log(`POST /api/auth/register (duplicate) -> ${dupRes.status}`);
  if (dupRes.status !== 409) throw new Error('Expected 409 Conflict for duplicate email');

  // 4. Login with wrong password
  const badLoginRes = await fetch(`${BACKEND_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testUser.email, password: 'WrongPassword!' })
  });
  console.log(`POST /api/auth/login (bad password) -> ${badLoginRes.status}`);
  if (badLoginRes.status !== 401) throw new Error('Expected 401 for bad password');

  // 5. Login with correct password
  const loginRes = await fetch(`${BACKEND_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testUser.email, password: testUser.password })
  });
  const loginData = await loginRes.json();
  console.log(`POST /api/auth/login -> ${loginRes.status}: token received length = ${loginData.token?.length}`);
  if (loginRes.status !== 200 || !loginData.token) throw new Error('Login failed or no token');

  console.log('✅ All backend authentication tests passed!');
}

testBackendAuth().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
