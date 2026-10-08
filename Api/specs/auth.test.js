const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');
const db = require('./database');
const User = require('../models/user');
const RefreshToken = require('../models/rt');

let user;
beforeAll(db.connect);
beforeEach(async () => {
  await db.clear();
  user = await User.create({ email: 'test@meblabs.com', password: 'testtest', fullname: 'Test User' });
});
afterAll(db.close);
const login = agent => agent.post('/auth/login').send({ email: 'test@meblabs.com', password: 'testtest' });
const cookie = (response, name) =>
  response.headers['set-cookie'].find(value => value.startsWith(name + '=')).split(';')[0];

test('login validates credentials, sets HttpOnly cookies and returns a public profile', async () => {
  const agent = request.agent(app);
  const response = await login(agent).expect(200);
  expect(response.body).toMatchObject({ _id: user.id, fullname: 'Test User', email: user.email });
  expect(response.body).not.toHaveProperty('password');
  expect(response.headers['set-cookie']).toHaveLength(2);
  expect(response.headers['set-cookie'].every(value => value.includes('HttpOnly'))).toBe(true);
  const stored = await User.findById(user.id).select('+password');
  expect(stored.password).not.toBe('testtest');
  await agent.get('/auth/check').expect(200);
});

test.each([
  {},
  { email: 'invalid', password: 'testtest' },
  { email: 'test@meblabs.com' },
  { email: { $ne: null }, password: 'testtest' },
  { email: 'test@meblabs.com', password: 'x'.repeat(129) }
])('invalid login payload is rejected: %j', async body => {
  await request(app).post('/auth/login').send(body).expect(400);
});

test.each(['wrong-password', ''])('wrong or missing password cannot create a session', async password => {
  const response = await request(app).post('/auth/login').send({ email: user.email, password });
  expect(response.status).toBe(password ? 401 : 400);
  expect(response.headers['set-cookie']).toBeUndefined();
});

test('unknown email cannot sign in', async () => {
  await request(app).post('/auth/login').send({ email: 'nobody@example.com', password: 'testtest' }).expect(401);
});

test('missing, malformed and expired access tokens are rejected', async () => {
  await request(app).get('/auth/check').expect(401);
  await request(app).get('/auth/check').set('Cookie', 'accessToken=invalid').expect(401);
  const expired = jwt.sign({ type: 'access' }, process.env.JWT_SECRET, { subject: user.id, expiresIn: -1 });
  await request(app)
    .get('/auth/check')
    .set('Cookie', 'accessToken=' + expired)
    .expect(401);
});

test('a refresh cookie restores access, and logout revokes that refresh session', async () => {
  const response = await login(request(app)).expect(200);
  const refresh = cookie(response, 'refreshToken');
  const renewed = await request(app).get('/auth/rt').set('Cookie', refresh).expect(200);
  expect(renewed.body._id).toBe(user.id);
  await request(app).get('/auth/check').set('Cookie', cookie(renewed, 'accessToken')).expect(200);
  const logout = await request(app).get('/auth/logout').set('Cookie', refresh).expect(200);
  expect(logout.headers['set-cookie']).toHaveLength(2);
  expect(await RefreshToken.countDocuments()).toBe(0);
  await request(app).get('/auth/rt').set('Cookie', refresh).expect(401);
});

test('missing, forged, expired and wrong-purpose refresh tokens are rejected', async () => {
  await request(app).get('/auth/rt').expect(401);
  await request(app).get('/auth/rt').set('Cookie', 'refreshToken=invalid').expect(401);
  const expired = jwt.sign({ type: 'refresh' }, process.env.RT_SECRET, { subject: user.id, expiresIn: -1 });
  await request(app)
    .get('/auth/rt')
    .set('Cookie', 'refreshToken=' + expired)
    .expect(401);
  const wrongPurpose = jwt.sign({ type: 'access' }, process.env.RT_SECRET, { subject: user.id });
  await request(app)
    .get('/auth/rt')
    .set('Cookie', 'refreshToken=' + wrongPurpose)
    .expect(401);
});

test('deleted users cannot use existing access or refresh sessions', async () => {
  const agent = request.agent(app);
  await login(agent).expect(200);
  await User.deleteOne({ _id: user.id });
  await agent.get('/auth/check').expect(401);
  await agent.get('/auth/rt').expect(401);
});
