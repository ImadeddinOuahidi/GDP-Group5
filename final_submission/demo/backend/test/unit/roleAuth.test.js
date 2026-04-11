const test = require('node:test');
const assert = require('node:assert/strict');

const {
  requirePatient,
  requireHealthcareProvider,
  requireAdmin,
  allowPatientOrProvider,
  allowPatientProgressionAccess,
  requireRoles,
  requirePermissions
} = require('../../middleware/roleAuth');

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

test('role auth blocks non-patients from patient-only routes', () => {
  const res = createResponseMock();
  let nextCalled = false;

  requirePatient({ user: { role: 'doctor' } }, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
  assert.match(res.body.message, /Patient access required/i);
});

test('role auth allows a healthcare provider to access provider routes', () => {
  const res = createResponseMock();
  let nextCalled = false;

  requireHealthcareProvider({ user: { role: 'doctor' } }, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, null);
});

test('role auth blocks non-admins from admin routes', () => {
  const res = createResponseMock();
  let nextCalled = false;

  requireAdmin({ user: { role: 'patient' } }, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
  assert.match(res.body.message, /Administrator access required/i);
});

test('role auth allows a patient to access their own data or a provider to access any data', () => {
  const selfRes = createResponseMock();
  const providerRes = createResponseMock();
  let selfNext = false;
  let providerNext = false;

  allowPatientOrProvider(
    { user: { role: 'patient', _id: { toString: () => 'patient-1' } }, params: { userId: 'patient-1' } },
    selfRes,
    () => {
      selfNext = true;
    }
  );

  allowPatientOrProvider(
    { user: { role: 'doctor', _id: { toString: () => 'doctor-1' } }, params: { userId: 'patient-2' } },
    providerRes,
    () => {
      providerNext = true;
    }
  );

  assert.equal(selfNext, true);
  assert.equal(selfRes.statusCode, null);
  assert.equal(providerNext, true);
  assert.equal(providerRes.statusCode, null);
});

test('role auth blocks patients from accessing other patients progressions', () => {
  const res = createResponseMock();
  let nextCalled = false;

  allowPatientProgressionAccess(
    {
      user: { role: 'patient', _id: { toString: () => 'patient-1' } },
      query: { userId: 'patient-2' },
      method: 'GET',
      body: {}
    },
    res,
    () => {
      nextCalled = true;
    }
  );

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
  assert.match(res.body.message, /own symptom progressions/i);
});

test('role auth allows patients to access their own progressions and providers to access all progressions', () => {
  const patientRes = createResponseMock();
  const providerRes = createResponseMock();
  let patientNext = false;
  let providerNext = false;

  allowPatientProgressionAccess(
    {
      user: { role: 'patient', _id: { toString: () => 'patient-1' } },
      query: { userId: 'patient-1' },
      method: 'GET',
      body: {}
    },
    patientRes,
    () => {
      patientNext = true;
    }
  );

  allowPatientProgressionAccess(
    {
      user: { role: 'doctor', _id: { toString: () => 'doctor-1' } },
      query: { userId: 'patient-2' },
      method: 'GET',
      body: {}
    },
    providerRes,
    () => {
      providerNext = true;
    }
  );

  assert.equal(patientNext, true);
  assert.equal(patientRes.statusCode, null);
  assert.equal(providerNext, true);
  assert.equal(providerRes.statusCode, null);
});

test('role auth middleware enforces custom role and permission sets', () => {
  const roleRes = createResponseMock();
  const permissionRes = createResponseMock();
  let roleNext = false;
  let permissionNext = false;

  requireRoles(['doctor', 'admin'])(
    { user: { role: 'doctor' } },
    roleRes,
    () => {
      roleNext = true;
    }
  );

  requirePermissions('reports:approve')(
    { user: { role: 'admin', permissions: ['reports:approve'] } },
    permissionRes,
    () => {
      permissionNext = true;
    }
  );

  assert.equal(roleNext, true);
  assert.equal(roleRes.statusCode, null);
  assert.equal(permissionNext, true);
  assert.equal(permissionRes.statusCode, null);
});
