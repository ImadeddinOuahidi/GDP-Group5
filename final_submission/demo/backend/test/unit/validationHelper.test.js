const test = require('node:test');
const assert = require('node:assert/strict');

const {
  validateEmail,
  validatePassword,
  validateRequiredFields,
  validateEnum,
  validateNumberRange,
  validateStringLength,
  validateDate,
  validatePastDate,
  validateFutureDate,
  validateUrl,
  sanitizeString,
  validatePagination
} = require('../../utils/validationHelper');
const AppError = require('../../utils/appError');

test('validationHelper validates email, password, and required fields', () => {
  assert.equal(validateEmail('patient@example.com'), true);
  assert.equal(validatePassword('Aa1!passw'), true);
  assert.equal(validateRequiredFields(
    { count: 0, subscribed: false, name: 'SafeMed' },
    ['count', 'subscribed', 'name']
  ), true);
});

test('validationHelper rejects invalid email and weak password with AppError', () => {
  assert.throws(() => validateEmail('invalid-email'), (error) => {
    assert.ok(error instanceof AppError);
    assert.equal(error.statusCode, 400);
    assert.equal(error.message, 'Invalid email format');
    return true;
  });

  assert.throws(() => validatePassword('weakpass'), (error) => {
    assert.ok(error instanceof AppError);
    assert.equal(error.statusCode, 400);
    assert.match(error.message, /Password must be at least 8 characters long/);
    return true;
  });
});

test('validationHelper validates enums, numbers, and strings', () => {
  assert.equal(validateEnum('doctor', ['patient', 'doctor', 'admin'], 'Role'), true);
  assert.equal(validateNumberRange('12.5', 10, 20, 'Dosage'), true);
  assert.equal(validateStringLength('SafeMed', 3, 20, 'App name'), true);
});

test('validationHelper rejects invalid enum, out-of-range number, and bad string length', () => {
  assert.throws(() => validateEnum('guest', ['patient', 'doctor', 'admin'], 'Role'));
  assert.throws(() => validateNumberRange('not-a-number', 1, 10, 'Dosage'));
  assert.throws(() => validateStringLength(123, 1, 10, 'Name'));
});

test('validationHelper validates dates, URLs, sanitization, and pagination', () => {
  const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  assert.equal(validateDate('2026-04-10'), true);
  assert.equal(validatePastDate(pastDate, 'Incident date'), true);
  assert.equal(validateFutureDate(futureDate, 'Follow-up date'), true);
  assert.equal(validateUrl('https://example.com/report/123'), true);
  assert.equal(sanitizeString('  <p>SafeMed</p>  '), 'SafeMed');

  assert.deepEqual(
    validatePagination({ page: '0', limit: '250' }),
    { page: 1, limit: 100, skip: 0 }
  );
});

test('validationHelper throws on invalid dates and URLs', () => {
  assert.throws(() => validateDate('not-a-date'));
  assert.throws(() => validatePastDate(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), 'Incident date'));
  assert.throws(() => validateFutureDate(new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), 'Follow-up date'));
  assert.throws(() => validateUrl('ftp://example.com'));
});
