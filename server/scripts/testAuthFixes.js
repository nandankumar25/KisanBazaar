const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const assert = require('assert');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const { login, googleLogin } = require('../controllers/authController');

const runAuthFixTests = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/kisanbazaar';
  await mongoose.connect(mongoUri);
  console.log('MongoDB Connected for testing Auth fixes...\n');

  let passed = 0;
  let failed = 0;

  const test = async (name, fn) => {
    try {
      await fn();
      console.log(`✓ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`✗ FAIL: ${name}`);
      console.error(err.message);
      failed++;
    }
  };

  // Helper mock response
  const createMockRes = () => {
    const res = {
      statusCode: null,
      jsonData: null,
      cookies: {},
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.jsonData = data;
        return this;
      },
      cookie(name, val, options) {
        this.cookies[name] = { val, options };
        return this;
      },
    };
    return res;
  };

  // 1. Unregistered email login
  await test('Sign In with unregistered email returns 404 "Account not found. Please create an account first."', async () => {
    const req = {
      body: {
        email: 'unregistered_test_user_xyz@kisanbazaar.com',
        password: 'SomePassword123',
      },
    };
    const res = createMockRes();
    await login(req, res, (err) => { if (err) throw err; });

    assert.strictEqual(res.statusCode, 404, 'Status should be 404');
    assert.strictEqual(res.jsonData.success, false);
    assert.strictEqual(res.jsonData.message, 'Account not found. Please create an account first.');
    assert.strictEqual(Object.keys(res.cookies).length, 0, 'No cookie should be issued');
  });

  // 2. Registered email with wrong password
  await test('Sign In with wrong password returns 401 "Invalid email or password."', async () => {
    const req = {
      body: {
        email: 'admin@kisanbazaar.com',
        password: 'WrongPassword999',
      },
    };
    const res = createMockRes();
    await login(req, res, (err) => { if (err) throw err; });

    assert.strictEqual(res.statusCode, 401, 'Status should be 401');
    assert.strictEqual(res.jsonData.success, false);
    assert.strictEqual(res.jsonData.message, 'Invalid email or password.');
  });

  // 3. Registered email with right password
  await test('Sign In with registered email returns 200 with saved database role', async () => {
    const req = {
      body: {
        email: 'admin@kisanbazaar.com',
        password: 'AdminSecret123',
      },
    };
    const res = createMockRes();
    await login(req, res, (err) => { if (err) throw err; });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.jsonData.success, true);
    assert.strictEqual(res.jsonData.user.role, 'ADMIN');
    assert(res.cookies.token, 'Token cookie should be issued');
  });

  // Cleanup test Google user if any
  const testGoogleEmail = 'google_test_brand_new_user@example.com';
  await User.deleteMany({ email: testGoogleEmail });

  // 4. Test Google Sign In for unregistered email without isRegistration
  await test('Google Sign In for unregistered email returns 404 "Account not found. Please register first."', async () => {
    // Mock OAuth2Client prototype verifyIdToken
    const { OAuth2Client } = require('google-auth-library');
    const originalVerify = OAuth2Client.prototype.verifyIdToken;
    OAuth2Client.prototype.verifyIdToken = async () => ({
      getPayload: () => ({
        email: testGoogleEmail,
        name: 'Brand New Google User',
        sub: 'google-sub-id-test-12345',
        picture: 'https://example.com/avatar.jpg',
      }),
    });

    try {
      const req = {
        body: {
          credential: 'fake-google-credential-token',
          isRegistration: false,
        },
      };
      const res = createMockRes();
      await googleLogin(req, res, (err) => { if (err) throw err; });

      assert.strictEqual(res.statusCode, 404);
      assert.strictEqual(res.jsonData.success, false);
      assert.strictEqual(res.jsonData.message, 'Account not found. Please register first.');
      assert.strictEqual(Object.keys(res.cookies).length, 0, 'No cookie should be set');

      // Ensure user was NOT created in DB
      const userInDb = await User.findOne({ email: testGoogleEmail });
      assert.strictEqual(userInDb, null, 'User must not be created in database');
    } finally {
      OAuth2Client.prototype.verifyIdToken = originalVerify;
    }
  });

  // 5. Test Google Register flow (with isRegistration: true and role: 'BUYER')
  await test('Google Register flow creates user with selected role and issues session', async () => {
    const { OAuth2Client } = require('google-auth-library');
    const originalVerify = OAuth2Client.prototype.verifyIdToken;
    OAuth2Client.prototype.verifyIdToken = async () => ({
      getPayload: () => ({
        email: testGoogleEmail,
        name: 'Brand New Google User',
        sub: 'google-sub-id-test-12345',
        picture: 'https://example.com/avatar.jpg',
      }),
    });

    try {
      const req = {
        body: {
          credential: 'fake-google-credential-token',
          isRegistration: true,
          role: 'BUYER',
        },
      };
      const res = createMockRes();
      await googleLogin(req, res, (err) => { if (err) throw err; });

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.jsonData.success, true);
      assert.strictEqual(res.jsonData.user.role, 'BUYER', 'Saved role must be BUYER');
      assert(res.cookies.token, 'Session cookie must be issued');

      // Verify in DB
      const userInDb = await User.findOne({ email: testGoogleEmail });
      assert(userInDb, 'User must exist in database');
      assert.strictEqual(userInDb.role, 'BUYER');
    } finally {
      OAuth2Client.prototype.verifyIdToken = originalVerify;
    }
  });

  // 6. Test Google Sign In for existing user preserves their database role
  await test('Google Sign In for existing user preserves their database role', async () => {
    const { OAuth2Client } = require('google-auth-library');
    const originalVerify = OAuth2Client.prototype.verifyIdToken;
    OAuth2Client.prototype.verifyIdToken = async () => ({
      getPayload: () => ({
        email: testGoogleEmail,
        name: 'Brand New Google User',
        sub: 'google-sub-id-test-12345',
        picture: 'https://example.com/avatar.jpg',
      }),
    });

    try {
      const req = {
        body: {
          credential: 'fake-google-credential-token',
          isRegistration: false,
        },
      };
      const res = createMockRes();
      await googleLogin(req, res, (err) => { if (err) throw err; });

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.jsonData.success, true);
      assert.strictEqual(res.jsonData.user.role, 'BUYER', 'Database role BUYER must be preserved');
      assert(res.cookies.token, 'Session cookie must be issued');
    } finally {
      OAuth2Client.prototype.verifyIdToken = originalVerify;
      // Clean up test user
      await User.deleteMany({ email: testGoogleEmail });
    }
  });

  console.log(`\n--------------------------------------------`);
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`--------------------------------------------\n`);

  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
};

runAuthFixTests();
