const test = require('node:test');
const assert = require('node:assert/strict');
const multer = require('multer');

const {
  handleUploadErrors,
  validateUploadedFiles
} = require('../../middleware/fileUpload');

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

test('file upload validation rejects requests with no text or files', () => {
  const res = createResponseMock();
  let nextCalled = false;

  validateUploadedFiles({ body: {} }, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.message, 'At least one input (text, image, video, or audio) is required.');
});

test('file upload validation rejects text that exceeds the maximum length', () => {
  const res = createResponseMock();
  let nextCalled = false;

  validateUploadedFiles(
    { body: { text: 'x'.repeat(5001) } },
    res,
    () => {
      nextCalled = true;
    }
  );

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /Text input too long/i);
});

test('file upload validation accepts a valid text payload', () => {
  const res = createResponseMock();
  let nextCalled = false;

  validateUploadedFiles(
    { body: { text: 'Patient reported nausea after taking medicine.' } },
    res,
    () => {
      nextCalled = true;
    }
  );

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, null);
});

test('file upload validation rejects oversized audio attachments', () => {
  const res = createResponseMock();
  let nextCalled = false;

  validateUploadedFiles(
    {
      body: {},
      files: {
        audio: [{
          size: 25 * 1024 * 1024 + 1,
          originalname: 'note.m4a'
        }]
      }
    },
    res,
    () => {
      nextCalled = true;
    }
  );

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /Audio file is too large/i);
});

test('file upload validation allows a small image attachment to proceed', () => {
  const res = createResponseMock();
  let nextCalled = false;

  validateUploadedFiles(
    {
      body: {},
      files: {
        images: [{
          size: 1024,
          originalname: 'rash.jpg',
          buffer: Buffer.from('image-bytes')
        }]
      }
    },
    res,
    () => {
      nextCalled = true;
    }
  );

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, null);
});

test('file upload error handler normalizes multer size and field errors', () => {
  const sizeRes = createResponseMock();
  const countRes = createResponseMock();
  const fieldRes = createResponseMock();

  handleUploadErrors(new multer.MulterError('LIMIT_FILE_SIZE'), {}, sizeRes, () => {});
  handleUploadErrors(new multer.MulterError('LIMIT_FILE_COUNT'), {}, countRes, () => {});
  handleUploadErrors(new multer.MulterError('LIMIT_UNEXPECTED_FILE'), {}, fieldRes, () => {});

  assert.equal(sizeRes.statusCode, 400);
  assert.match(sizeRes.body.message, /File size too large/i);
  assert.equal(countRes.statusCode, 400);
  assert.match(countRes.body.message, /Too many files/i);
  assert.equal(fieldRes.statusCode, 400);
  assert.match(fieldRes.body.message, /Unexpected field name/i);
});

test('file upload error handler preserves invalid format messages', () => {
  const res = createResponseMock();

  handleUploadErrors(new Error('Invalid image format. Allowed formats: JPEG, PNG, GIF, WebP'), {}, res, () => {});

  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /Invalid image format/i);
});
