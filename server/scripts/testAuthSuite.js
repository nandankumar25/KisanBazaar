const dotenv = require('dotenv');
dotenv.config();
const http = require('http');
const app = require('../server');
const mongoose = require('mongoose');
const User = require('../models/User');

async function runTests() {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(5005, resolve));
  const baseUrl = 'http://localhost:5005/api';

  console.log('--- Starting Authentication & Authorization Test Suite ---');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`✗ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Test Admin Registration Rejection
    const adminRegRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Hacker',
        email: 'hacker@example.com',
        password: 'password123',
        role: 'ADMIN',
      }),
    });
    const adminRegData = await adminRegRes.json();
    assert(
      adminRegRes.status === 400 && adminRegData.message.includes('prohibited'),
      'Public registration as ADMIN is rejected'
    );

    // Clean up test users if existing
    await User.deleteMany({ email: { $in: ['testfarmer_auth@example.com', 'testbuyer_auth@example.com'] } });

    // 2. Test Farmer Registration
    const farmerRegRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Farmer Auth',
        email: 'testfarmer_auth@example.com',
        password: 'FarmerPassword123',
        phone: '9988776655',
        role: 'FARMER',
        location: { state: 'Punjab', district: 'Ludhiana' },
      }),
    });
    const farmerRegData = await farmerRegRes.json();
    assert(farmerRegRes.status === 201 && farmerRegData.success, 'Farmer registration succeeds');
    assert(!farmerRegData.user?.password, 'User password is never returned in response');

    // Extract cookie
    const setCookie = farmerRegRes.headers.get('set-cookie');
    assert(setCookie && setCookie.includes('token='), 'HttpOnly token cookie is returned on register');

    // 3. Test Farmer Me endpoint
    const meRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { Cookie: setCookie },
    });
    const meData = await meRes.json();
    assert(meRes.status === 200 && meData.user?.role === 'FARMER', 'GET /api/auth/me returns authenticated farmer');

    // 4. Test RBAC: Farmer cannot access Admin stats
    const farmerAdminAccess = await fetch(`${baseUrl}/admin/stats`, {
      headers: { Cookie: setCookie },
    });
    assert(farmerAdminAccess.status === 403, 'FARMER cannot access ADMIN endpoints (403 Forbidden)');

    // 5. Test Admin Login
    const adminLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@kisanbazaar.com',
        password: 'AdminSecret123',
      }),
    });
    const adminLoginData = await adminLoginRes.json();
    assert(adminLoginRes.status === 200 && adminLoginData.user?.role === 'ADMIN', 'Admin login succeeds with ADMIN role');
    const adminCookie = adminLoginRes.headers.get('set-cookie');

    // 6. Test Admin Stats Access
    const adminStatsRes = await fetch(`${baseUrl}/admin/stats`, {
      headers: { Cookie: adminCookie },
    });
    const adminStatsData = await adminStatsRes.json();
    assert(adminStatsRes.status === 200 && adminStatsData.data?.users, 'ADMIN can access /api/admin/stats');

    // 7. Test Logout
    const logoutRes = await fetch(`${baseUrl}/auth/logout`, {
      method: 'POST',
      headers: { Cookie: adminCookie },
    });
    const logoutCookie = logoutRes.headers.get('set-cookie') || '';
    assert(
      logoutRes.status === 200 && (logoutCookie.toLowerCase().includes('max-age=0') || logoutCookie.toLowerCase().includes('expires=thu, 01 jan 1970')),
      'POST /api/auth/logout clears auth cookie'
    );

    // Clean up test farmer
    await User.deleteMany({ email: 'testfarmer_auth@example.com' });

    console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    server.close();
    await mongoose.connection.close();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
