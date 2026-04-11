import {
  validateAge,
  validateEmail,
  validateForm,
  validatePassword,
  validatePhone,
  validateRequired,
} from './validation';

describe('validation utilities', () => {
  test('accepts valid emails and rejects malformed ones', () => {
    expect(validateEmail('patient@example.com')).toBe(true);
    expect(validateEmail('invalid-email')).toBe(false);
    expect(validateEmail('missing-domain@')).toBe(false);
  });

  test('accepts valid password, phone, required value, and age boundaries', () => {
    expect(validatePassword('secret1')).toBe(true);
    expect(validatePassword('123')).toBe(false);
    expect(validatePhone('(555) 123-4567')).toBe(true);
    expect(validatePhone('555-12')).toBe(false);
    expect(validateRequired(' report details ')).toBe(true);
    expect(validateRequired('   ')).toBe(false);
    expect(validateAge('0')).toBe(true);
    expect(validateAge('150')).toBe(true);
    expect(validateAge('151')).toBe(false);
  });

  test('returns field-level errors when form data violates the rules', () => {
    const result = validateForm(
      {
        email: 'bad-email',
        password: '123',
        phone: '555',
        age: '151',
        notes: '',
      },
      {
        email: { required: true, type: 'email' },
        password: { required: true, type: 'password' },
        phone: { required: true, type: 'phone' },
        age: { required: true, type: 'age' },
        notes: { required: true, minLength: 5 },
      }
    );

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual({
      email: 'Please enter a valid email address',
      password: 'Password must be at least 6 characters long',
      phone: 'Please enter a valid phone number',
      age: 'Please enter a valid age',
      notes: 'notes is required',
    });
  });
});
