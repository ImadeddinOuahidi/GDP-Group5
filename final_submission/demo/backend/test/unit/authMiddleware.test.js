const test = require('node:test');
const assert = require('node:assert/strict');

const {
  protect,
  restrictTo,
  requireEmailVerification,
  allowOwnerOrAdmin
} = require('../../middleware/auth');

function createResponseMock() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
}

test('auth middleware rejects requests without a bearer token', async () => {
  const res = createResponseMock();
  let nextCalled = false;

  await protect({ headers: {} }, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.success, false);
  assert.match(res.body.message, /No token provided/i);
});

test('role restriction rejects authenticated users with the wrong role', () => {
  const res = createResponseMock();
  let nextCalled = false;

  restrictTo('doctor')(
    { user: { role: 'patient' } },
    res,
    () => {
      nextCalled = true;
    }
  );

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
  assert.match(res.body.message, /do not have permission/i);
});

test('role restriction allows users with the required role', () => {
  const res = createResponseMock();
  let nextCalled = false;

  restrictTo('doctor', 'admin')(
    { user: { role: 'doctor' } },
    res,
    () => {
      nextCalled = true;
    }
  );

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, null);
});

test('email verification middleware blocks unverified users', () => {
  const res = createResponseMock();
  let nextCalled = false;

  requireEmailVerification(
    { user: { isEmailVerified: false } },
    res,
    () => {
      nextCalled = true;
    }
  );

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
  assert.match(res.body.message, /verify your email/i);
});

test('owner-or-admin middleware allows a user to access their own record', () => {
  const res = createResponseMock();
  let nextCalled = false;

  allowOwnerOrAdmin(
    {
      user: {
        _id: { toString: () => 'user-123' },
        role: 'patient'
      },
      params: { userId: 'user-123' }
    },
    res,
    () => {
      nextCalled = true;
    }
  );

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, null);
});

test('owner-or-admin middleware blocks a non-admin from accessing another record', () => {
  const res = createResponseMock();
  let nextCalled = false;

  allowOwnerOrAdmin(
    {
      user: {
        _id: { toString: () => 'user-123' },
        role: 'patient'
      },
      params: { userId: 'user-999' }
    },
    res,
    () => {
      nextCalled = true;
    }
  );

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
  assert.match(res.body.message, /own data/i);
});
