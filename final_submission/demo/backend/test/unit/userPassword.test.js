const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');

const User = require('../../models/User');

function buildValidAdminUser() {
  return new User({
    firstName: 'Test',
    lastName: 'User',
    email: 'test.user@example.com',
    password: 'Plain123',
    phone: '+1234567890',
    dateOfBirth: new Date('1990-01-01T00:00:00.000Z'),
    gender: 'female',
    role: 'admin',
    address: {
      street: '1 Main St',
      city: 'Testville',
      state: 'TS',
      zipCode: '12345',
      country: 'USA'
    },
    adminInfo: {
      department: 'IT',
      employeeId: 'EMP-1'
    }
  });
}

test('User password hashes before save and is not persisted in plaintext', async () => {
  const originalReadyState = User.db.readyState;
  const originalConnReadyState = User.collection.conn.readyState;
  const originalInsertOne = User.collection.insertOne;
  const originalUpdateOne = User.collection.updateOne;
  let persistedPassword = null;

  User.db.readyState = 1;
  User.collection.conn.readyState = 1;
  User.collection.insertOne = async function insertOne(doc) {
    persistedPassword = doc.password;
    return { insertedId: doc._id };
  };
  User.collection.updateOne = async function updateOne() {
    throw new Error('updateOne should not be called for a new user');
  };

  try {
    const user = buildValidAdminUser();
    const plainPassword = user.password;

    await user.save();

    assert.equal(persistedPassword, user.password);
    assert.notEqual(user.password, plainPassword);
    assert.equal(await bcrypt.compare(plainPassword, user.password), true);
    assert.equal(user.password.includes('Plain123'), false);
  } finally {
    User.collection.insertOne = originalInsertOne;
    User.collection.updateOne = originalUpdateOne;
    User.db.readyState = originalReadyState;
    User.collection.conn.readyState = originalConnReadyState;
  }
});

test('User password is excluded by default at the schema level', () => {
  assert.equal(User.schema.path('password').options.select, false);
});
