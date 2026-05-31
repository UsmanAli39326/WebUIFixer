const mongoose = require('mongoose');
const supertest = require('supertest');
const jwt = require('jsonwebtoken');

// Mocks
jest.mock('../ai/fastapiClient', () => ({
  analyzeWebsite: jest.fn().mockResolvedValue({
    url: 'https://example.com',
    summary: { currentScore: 80, totalIssues: 1, bySeverity: { high: 1 } },
    issues: [{ ruleId: 'rule1', severity: 'high', message: 'Test issue', htmlSnippet: '<div></div>', accepted: false }],
    fixedHtml: '<div>Fixed</div>',
    styleOverlay: ''
  })
}));

jest.mock('../services/emailService', () => ({
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true)
}));

const app = require('../server');
const request = supertest(app);

const User = require('../models/User');
const Audit = require('../models/Audit');

const { MongoMemoryServer } = require('mongodb-memory-server');
let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    if (mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
    }
    await mongoose.connection.close();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// Utilities
async function registerUser(overrides = {}) {
  const email = overrides.email || 'test@example.com';
  const password = overrides.password || 'Password123';
  const res = await request.post('/api/auth/register').send({
    name: 'Test User',
    email,
    password,
    ...overrides
  });
  
  if (res.status !== 201 && res.status !== 400) {
    console.error('registerUser failed:', res.status, res.body);
  }
  
  let token;
  if (res.status === 201 && res.body.user) {
    const loginRes = await request.post('/api/auth/login').send({ email, password });
    token = loginRes.body.token;
  }
  
  return { user: res.body.user, token };
}

async function registerAdmin() {
  const res = await request.post('/api/auth/register').send({
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'Password123'
  });
  const user = await User.findById(res.body.user.id);
  user.role = 'admin';
  await user.save();
  // sign new token since role changed
  const token = makeToken({ id: user._id, role: 'admin' });
  return { user: { id: user._id, role: 'admin' }, token };
}

async function createAudit(userId, overrides = {}) {
  const id = Date.now().toString();
  await Audit.save(id, {
    url: 'https://example.com',
    userId,
    summary: { currentScore: 80, totalIssues: 1, bySeverity: { high: 1 } },
    issues: [{ ruleId: 'rule1', severity: 'high', message: 'Test issue', accepted: null }],
    ...overrides
  });
  return await Audit.get(id);
}

function makeToken(payload) {
  // Use JWT_SECRET from env or default
  const secret = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here';
  return jwt.sign(payload, secret, { expiresIn: '1h' });
}

describe('1. Auth — Registration', () => {
  it('Register with valid data -> 201, returns user object without password field', async () => {
    const res = await request.post('/api/auth/register').send({
      name: 'Valid User',
      email: 'valid@example.com',
      password: 'Password123'
    });
    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.password).toBeUndefined();
  });

  it('Register with duplicate email -> 400', async () => {
    await registerUser({ email: 'dup@example.com' });
    const res = await request.post('/api/auth/register').send({
      name: 'Dup User',
      email: 'dup@example.com',
      password: 'Password123'
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('Register with missing name -> 400', async () => {
    const res = await request.post('/api/auth/register').send({
      email: 'noname@example.com',
      password: 'Password123'
    });
    expect(res.status).toBe(400);
  });

  it('Register with weak password (no uppercase, no number) -> 400', async () => {
    const res = await request.post('/api/auth/register').send({
      name: 'Weak',
      email: 'weak@example.com',
      password: 'weakpassword'
    });
    expect(res.status).toBe(400);
  });

  it('Register with invalid email -> 400', async () => {
    const res = await request.post('/api/auth/register').send({
      name: 'Invalid',
      email: 'notanemail',
      password: 'Password123'
    });
    expect(res.status).toBe(400);
  });
});

describe('2. Auth — Login', () => {
  beforeEach(async () => {
    await registerUser({ email: 'login@example.com', password: 'Password123' });
  });

  it('Login with correct credentials -> 200, returns token', async () => {
    const res = await request.post('/api/auth/login').send({
      email: 'login@example.com',
      password: 'Password123'
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('Login with wrong password -> 401', async () => {
    const res = await request.post('/api/auth/login').send({
      email: 'login@example.com',
      password: 'Wrong123'
    });
    expect(res.status).toBe(401);
  });

  it('Login with non-existent email -> 401', async () => {
    const res = await request.post('/api/auth/login').send({
      email: 'nobody@example.com',
      password: 'Password123'
    });
    expect(res.status).toBe(401);
  });

  it('Login with a blocked user (isActive: false) -> 403', async () => {
    const user = await User.findByEmail('login@example.com');
    user.isActive = false;
    await user.save();
    
    const res = await request.post('/api/auth/login').send({
      email: 'login@example.com',
      password: 'Password123'
    });
    expect(res.status).toBe(403);
  });
});

describe('3. Auth — Logout', () => {
  it('Logout with valid token -> 200', async () => {
    const { token } = await registerUser();
    const res = await request.post('/api/auth/logout').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toBeDefined();
  });

  it('Using the same token again after logout -> 401 (blacklisted)', async () => {
    const { token } = await registerUser();
    await request.post('/api/auth/logout').set('Authorization', `Bearer ${token}`);
    
    const res = await request.get('/api/user/profile').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
  });

  it('Logout without token -> 403', async () => {
    const res = await request.post('/api/auth/logout');
    expect(res.status).toBe(403);
  });
});

describe('4. Auth — Forgot + Reset password', () => {
  it('Forgot password with valid email -> 200 (generic message, no leak)', async () => {
    await registerUser({ email: 'forgot@example.com' });
    const res = await request.post('/api/auth/forgot-password').send({ email: 'forgot@example.com' });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/If email exists, password reset OTP has been sent/i);
    expect(require('../services/emailService').sendPasswordResetEmail).toHaveBeenCalled();
  });

  it('Forgot password with unknown email -> 200 (same generic message)', async () => {
    const res = await request.post('/api/auth/forgot-password').send({ email: 'nobody@example.com' });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/If email exists, password reset OTP has been sent/i);
  });

  it('Reset password with a valid OTP + new password -> 200', async () => {
    await registerUser({ email: 'forgot@example.com' });
    
    // trigger OTP generation
    await request.post('/api/auth/forgot-password').send({ email: 'forgot@example.com' });
    
    // read OTP directly from DB (bypass email)
    const dbUser = await User.findByEmail('forgot@example.com');
    const otp = dbUser.passwordResetOtp;
    
    const res = await request.post('/api/auth/reset-password').send({
      email: 'forgot@example.com',
      otp,
      newPassword: 'NewPassword123'
    });
    expect(res.status).toBe(200);
  });

  it('Reset password with the same OTP a second time -> 400 (one-time-use)', async () => {
    await registerUser({ email: 'reset2@example.com' });
    await request.post('/api/auth/forgot-password').send({ email: 'reset2@example.com' });

    const dbUser = await User.findByEmail('reset2@example.com');
    const otp = dbUser.passwordResetOtp;

    // first use — should succeed
    await request.post('/api/auth/reset-password').send({
      email: 'reset2@example.com',
      otp,
      newPassword: 'NewPassword123'
    });

    // second use — OTP must be cleared/invalidated
    const res = await request.post('/api/auth/reset-password').send({
      email: 'reset2@example.com',
      otp,
      newPassword: 'AnotherPassword123'
    });
    expect(res.status).toBe(400);
  });

  it('Reset password with an invalid/wrong OTP -> 400', async () => {
    await registerUser({ email: 'wrong@example.com' });
    const res = await request.post('/api/auth/reset-password').send({
      email: 'wrong@example.com',
      otp: '000000',
      newPassword: 'NewPassword123'
    });
    expect(res.status).toBe(400);
  });
});

describe('5. User management', () => {
  it('Get profile with valid token -> 200, no password in response', async () => {
    const { token } = await registerUser();
    const res = await request.get('/api/user/profile').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.password).toBeUndefined();
    expect(res.body.email).toBeDefined();
  });

  it('Get profile without token -> 403', async () => {
    const res = await request.get('/api/user/profile');
    expect(res.status).toBe(403);
  });

  it('Update profile (name) -> 200, name changed in response', async () => {
    const { token } = await registerUser();
    const res = await request.put('/api/user/profile').set('Authorization', `Bearer ${token}`).send({ name: 'Changed Name' });
    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe('Changed Name');
  });

  it('Change password with correct old password -> 200', async () => {
    const { token } = await registerUser({ password: 'OldPassword123' });
    const res = await request.put('/api/user/change-password').set('Authorization', `Bearer ${token}`).send({
      oldPassword: 'OldPassword123',
      newPassword: 'NewPassword123'
    });
    expect(res.status).toBe(200);
  });

  it('Change password with wrong old password -> 401', async () => {
    const { token } = await registerUser({ password: 'OldPassword123' });
    const res = await request.put('/api/user/change-password').set('Authorization', `Bearer ${token}`).send({
      oldPassword: 'WrongPassword123',
      newPassword: 'NewPassword123'
    });
    expect(res.status).toBe(401);
  });

  it('Delete account with correct password -> 200, user no longer in DB', async () => {
    const { user, token } = await registerUser({ password: 'Password123' });
    const res = await request.delete('/api/user/account').set('Authorization', `Bearer ${token}`).send({ password: 'Password123' });
    expect(res.status).toBe(200);
    const dbUser = await User.findById(user.id);
    expect(dbUser).toBeNull();
  });

  it('Delete account with wrong password -> 401', async () => {
    const { user, token } = await registerUser({ password: 'Password123' });
    const res = await request.delete('/api/user/account').set('Authorization', `Bearer ${token}`).send({ password: 'WrongPassword123' });
    expect(res.status).toBe(401);
    const dbUser = await User.findById(user.id);
    expect(dbUser).not.toBeNull();
  });
});

describe('6. Admin — block user', () => {
  it('Admin blocks a user -> 200, isActive is false in DB', async () => {
    const { token: adminToken } = await registerAdmin();
    const { user } = await registerUser();
    
    const res = await request.patch(`/api/admin/users/${user.id}/block`).set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    const dbUser = await User.findById(user.id);
    expect(dbUser.isActive).toBe(false);
  });

  it('Blocked user attempts login -> 403', async () => {
    const { token: adminToken } = await registerAdmin();
    const { user } = await registerUser({ email: 'blockme@example.com', password: 'Password123' });
    await request.patch(`/api/admin/users/${user.id}/block`).set('Authorization', `Bearer ${adminToken}`);
    
    const res = await request.post('/api/auth/login').send({ email: 'blockme@example.com', password: 'Password123' });
    expect(res.status).toBe(403);
  });

  it('Admin unblocks user -> 200, isActive is true in DB', async () => {
    const { token: adminToken } = await registerAdmin();
    const { user } = await registerUser();
    await request.patch(`/api/admin/users/${user.id}/block`).set('Authorization', `Bearer ${adminToken}`);
    
    const res = await request.patch(`/api/admin/users/${user.id}/block`).set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    const dbUser = await User.findById(user.id);
    expect(dbUser.isActive).toBe(true);
  });

  it('Non-admin calling block endpoint -> 403', async () => {
    const { token } = await registerUser();
    const { user: target } = await registerUser({ email: 'target@example.com' });
    
    const res = await request.patch(`/api/admin/users/${target.id}/block`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

describe('7. Admin — analytics', () => {
  it('GET /api/admin/analytics as admin -> 200', async () => {
    const { token } = await registerAdmin();
    const res = await request.get('/api/admin/analytics').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.totalUsers).toBeDefined();
    expect(res.body.totalAudits).toBeDefined();
    expect(res.body.totalTemplates).toBeDefined();
    expect(res.body.totalDownloads).toBeDefined();
    expect(res.body.totalRevenue).toBeDefined();
  });

  it('GET /api/admin/analytics as regular user -> 403', async () => {
    const { token } = await registerUser();
    const res = await request.get('/api/admin/analytics').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

describe('8. Admin — activity logs', () => {
  it('GET /api/admin/logs as admin -> 200, returns array', async () => {
    const { token } = await registerAdmin();
    const res = await request.get('/api/admin/logs').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/admin/logs as regular user -> 403', async () => {
    const { token } = await registerUser();
    const res = await request.get('/api/admin/logs').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

describe('9. Admin — delete user', () => {
  it('Admin deletes a user -> 200, user gone from DB', async () => {
    const { token } = await registerAdmin();
    const { user } = await registerUser();
    const res = await request.delete(`/api/admin/users/${user.id}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    const dbUser = await User.findById(user.id);
    expect(dbUser).toBeNull();
  });

  it('Non-admin deletes a user -> 403', async () => {
    const { token } = await registerUser();
    const { user: target } = await registerUser({ email: 'target2@example.com' });
    const res = await request.delete(`/api/admin/users/${target.id}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

describe('10. Audit — report endpoints', () => {
  it('GET /api/audit/:id/report/pdf with valid audit -> 200, Content-Type application/pdf', async () => {
    const { user } = await registerUser();
    const audit = await createAudit(user.id);
    const res = await request.get(`/api/audit/${audit.id}/report/pdf`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('application/pdf');
  });

  it('GET /api/audit/:id/report/html with valid audit -> 200, Content-Type text/html', async () => {
    const { user } = await registerUser();
    const audit = await createAudit(user.id);
    const res = await request.get(`/api/audit/${audit.id}/report/html`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.text).toMatch(/score/i);
  });

  it('GET /api/audit/:id/report/pdf with non-existent id -> 404', async () => {
    const res = await request.get(`/api/audit/999999999/report/pdf`);
    expect(res.status).toBe(404);
  });
});

describe('11. Audit — delete', () => {
  it('Owner deletes their audit -> 200, audit gone from DB', async () => {
    const { user, token } = await registerUser();
    const audit = await createAudit(user.id);
    const res = await request.delete(`/api/audit/${audit.id}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    const dbAudit = await Audit.get(audit.id);
    expect(dbAudit).toBeNull();
  });

  it('Different user tries to delete someone else\'s audit -> 403', async () => {
    const { user } = await registerUser();
    const audit = await createAudit(user.id);
    const { token: otherToken } = await registerUser({ email: 'other@example.com' });
    const res = await request.delete(`/api/audit/${audit.id}`).set('Authorization', `Bearer ${otherToken}`);
    expect(res.status).toBe(403);
  });

  it('Delete non-existent audit -> 404', async () => {
    const { token } = await registerUser();
    const res = await request.delete(`/api/audit/999999999`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe('12. Audit — accept/reject suggestions', () => {
  it('Accept a suggestion by ruleId -> 200, accepted: true', async () => {
    const { user, token } = await registerUser();
    const audit = await createAudit(user.id);
    const res = await request.patch(`/api/audit/${audit.id}/suggestions/rule1/accept`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    const dbAudit = await Audit.get(audit.id);
    expect(dbAudit.issues[0].accepted).toBe(true);
  });

  it('Reject a suggestion by ruleId -> 200, accepted: false', async () => {
    const { user, token } = await registerUser();
    const audit = await createAudit(user.id);
    const res = await request.patch(`/api/audit/${audit.id}/suggestions/rule1/reject`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    const dbAudit = await Audit.get(audit.id);
    expect(dbAudit.issues[0].accepted).toBe(false);
  });

  it('Accept on an audit owned by a different user -> 403', async () => {
    const { user } = await registerUser();
    const audit = await createAudit(user.id);
    const { token: otherToken } = await registerUser({ email: 'other@example.com' });
    const res = await request.patch(`/api/audit/${audit.id}/suggestions/rule1/accept`).set('Authorization', `Bearer ${otherToken}`);
    expect(res.status).toBe(403);
  });
});

describe('13. Recommendations API', () => {
  it('GET /api/recommendations/:auditId as owner -> 200, returns recommendations array', async () => {
    const { user, token } = await registerUser();
    const audit = await createAudit(user.id);
    const res = await request.get(`/api/recommendations/${audit.id}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.recommendations)).toBe(true);
  });

  it('GET /api/recommendations/:auditId as different user -> 403', async () => {
    const { user } = await registerUser();
    const audit = await createAudit(user.id);
    const { token: otherToken } = await registerUser({ email: 'other@example.com' });
    const res = await request.get(`/api/recommendations/${audit.id}`).set('Authorization', `Bearer ${otherToken}`);
    expect(res.status).toBe(403);
  });

  it('GET /api/recommendations/:nonExistentId -> 404', async () => {
    const { token } = await registerUser();
    const res = await request.get(`/api/recommendations/999999999`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe('14. Marketplace — upload', () => {
  it('Upload template with valid data -> 200 or 201', async () => {
    const { token } = await registerUser();
    const res = await request.post('/api/marketplace/upload').set('Authorization', `Bearer ${token}`).send({
      title: 'Valid Template',
      url: 'https://example.com/template.zip',
      price: 10,
      description: 'Test template'
    });
    expect([200, 201]).toContain(res.status);
    expect(res.body.template).toBeDefined();
  });

  it('Upload template with missing title -> 400', async () => {
    const { token } = await registerUser();
    const res = await request.post('/api/marketplace/upload').set('Authorization', `Bearer ${token}`).send({
      url: 'https://example.com/template.zip',
      price: 10
    });
    expect(res.status).toBe(400);
  });

  it('Upload template with negative price -> 400', async () => {
    const { token } = await registerUser();
    const res = await request.post('/api/marketplace/upload').set('Authorization', `Bearer ${token}`).send({
      title: 'Template',
      url: 'https://example.com/template.zip',
      price: -5
    });
    expect(res.status).toBe(400);
  });

  it('Upload template without auth -> 403', async () => {
    const res = await request.post('/api/marketplace/upload').send({
      title: 'Template',
      url: 'https://example.com/template.zip',
      price: 10
    });
    expect(res.status).toBe(403);
  });

  it('Upload a file with disallowed type (e.g. .exe buffer) -> 400', async () => {
    const { token } = await registerUser();
    const res = await request.post('/api/marketplace/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('dummy exe content'), 'test.exe')
      .field('title', 'Exe Template')
      .field('price', 10)
      .field('url', 'https://example.com');
    expect(res.status).toBe(400);
  });
});

describe('15. Marketplace — browse and download', () => {
  let templateId;
  beforeEach(async () => {
    const { token } = await registerUser();
    const res = await request.post('/api/marketplace/upload').set('Authorization', `Bearer ${token}`).send({
      title: 'Browse Template',
      url: 'https://example.com/template.zip',
      price: 10,
      description: 'Test'
    });
    templateId = res.body.template.id;
  });

  it('GET /api/marketplace/templates -> 200, returns array (no auth required)', async () => {
    const res = await request.get('/api/marketplace/templates');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('GET /api/marketplace/templates?search=someterm -> 200, filtered results', async () => {
    const res = await request.get('/api/marketplace/templates?search=Browse');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('GET /api/marketplace/templates/:id/download without auth -> 403', async () => {
    const res = await request.get(`/api/marketplace/templates/${templateId}/download`);
    expect(res.status).toBe(403);
  });

  it('GET /api/marketplace/templates/:id/download with auth -> 200 or 404 (if no file on disk)', async () => {
    const { token } = await registerUser({ email: 'downloader@example.com' });
    const res = await request.get(`/api/marketplace/templates/${templateId}/download`).set('Authorization', `Bearer ${token}`);
    expect([200, 404]).toContain(res.status);
  });
});

describe('16. Marketplace — purchase stub', () => {
  let templateId;
  beforeEach(async () => {
    const { token } = await registerUser();
    const res = await request.post('/api/marketplace/upload').set('Authorization', `Bearer ${token}`).send({
      title: 'Purchase Template',
      url: 'https://example.com/template.zip',
      price: 10,
      description: 'Test'
    });
    templateId = res.body.template.id;
  });

  it('POST /api/marketplace/templates/:id/purchase with auth -> 501', async () => {
    const { token } = await registerUser({ email: 'buyer@example.com' });
    const res = await request.post(`/api/marketplace/templates/${templateId}/purchase`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(501);
  });

  it('POST /api/marketplace/templates/:id/purchase without auth -> 403', async () => {
    const res = await request.post(`/api/marketplace/templates/${templateId}/purchase`);
    expect(res.status).toBe(403);
  });
});

describe('17. Rate limiting', () => {
  it('Hit /api/auth/login rapidly -> 429 Too Many Requests', async () => {
    let status;
    for (let i = 0; i < 150; i++) {
      const res = await request.post('/api/auth/login').send({
        email: 'nobody@example.com',
        password: 'Password123'
      });
      status = res.status;
      if (status === 429) break;
    }
    expect(status).toBe(429);
  });
});
