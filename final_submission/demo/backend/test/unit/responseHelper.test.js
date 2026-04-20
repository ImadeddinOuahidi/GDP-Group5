const test = require('node:test');
const assert = require('node:assert/strict');

const {
  sendSuccess,
  sendCreated,
  sendError,
  sendValidationError
} = require('../../utils/responseHelper');

function createResponseMock() {
  return {
    statusCode: null,
    jsonBody: null,
    sent: false,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.jsonBody = payload;
      return this;
    },
    send() {
      this.sent = true;
      return this;
    }
  };
}

test('responseHelper formats success responses from the options-object signature', () => {
  const res = createResponseMock();

  sendSuccess(res, {
    data: { reportId: 'abc123' },
    message: 'Saved',
    statusCode: 201,
    meta: { page: 1 }
  });

  assert.equal(res.statusCode, 201);
  assert.deepEqual(res.jsonBody, {
    success: true,
    message: 'Saved',
    data: { reportId: 'abc123' },
    meta: { page: 1 }
  });
});

test('responseHelper also supports legacy positional success calls used by routes', () => {
  const res = createResponseMock();

  sendSuccess(res, null, 'File deleted successfully');

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.jsonBody, {
    success: true,
    message: 'File deleted successfully'
  });
});

test('responseHelper formats created responses with status 201', () => {
  const res = createResponseMock();

  sendCreated(res, { created: true }, 'Resource created');

  assert.equal(res.statusCode, 201);
  assert.equal(res.jsonBody.success, true);
  assert.equal(res.jsonBody.message, 'Resource created');
  assert.deepEqual(res.jsonBody.data, { created: true });
});

test('responseHelper also supports legacy positional error calls used by routes', () => {
  const res = createResponseMock();

  sendError(res, 'No file provided', 400);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.jsonBody, {
    success: false,
    message: 'No file provided'
  });
});

test('responseHelper wraps validation errors into the standard error shape', () => {
  const res = createResponseMock();

  sendValidationError(res, { field: 'email', message: 'Email is required' });

  assert.equal(res.statusCode, 422);
  assert.equal(res.jsonBody.success, false);
  assert.equal(res.jsonBody.message, 'Validation failed');
  assert.deepEqual(res.jsonBody.errors, [
    { field: 'email', message: 'Email is required' }
  ]);
});
