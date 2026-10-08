const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const db = require('./database');
const User = require('../models/user');
const Transaction = require('../models/transaction');

const entry = { type: 'expense', amountCents: 1234, category: 'Food', date: '2026-10-08', description: 'Lunch' };
let agent;
let user;
beforeAll(db.connect);
beforeEach(async () => {
  await db.clear();
  user = await User.create({ email: 'test@meblabs.com', password: 'testtest', fullname: 'Test User' });
  agent = request.agent(app);
  await agent.post('/auth/login').send({ email: user.email, password: 'testtest' }).expect(200);
});
afterAll(db.close);

test('complete CRUD round trip uses real MongoDB and keeps dates and money exact', async () => {
  await agent.get('/transactions').expect(200, []);
  const created = await agent.post('/transactions').send(entry).expect(201);
  const id = created.body._id;
  expect(created.body).toMatchObject(entry);
  expect(created.body).not.toHaveProperty('user');
  const persisted = await Transaction.findById(id);
  expect(persisted.user.toString()).toBe(user.id);
  expect(persisted.amountCents).toBe(1234);
  await agent.get('/transactions/' + id).expect(200);
  const list = await agent.get('/transactions').expect(200);
  expect(list.body).toHaveLength(1);
  const updated = await agent
    .patch('/transactions/' + id)
    .send({ amountCents: 2099, date: '2024-02-29', description: 'Edited' })
    .expect(200);
  expect(updated.body).toMatchObject({
    amountCents: 2099,
    date: '2024-02-29',
    description: 'Edited',
    category: 'Food'
  });
  expect((await Transaction.findById(id)).amountCents).toBe(2099);
  await agent.delete('/transactions/' + id).expect(200);
  expect(await Transaction.findById(id)).toBeNull();
  await agent.get('/transactions').expect(200, []);
  await agent.get('/transactions/' + id).expect(404);
});

test('income and expenses are listed by calendar date descending', async () => {
  await agent
    .post('/transactions')
    .send({ ...entry, date: '2026-01-01' })
    .expect(201);
  await agent
    .post('/transactions')
    .send({ ...entry, type: 'income', amountCents: 100000, date: '2026-12-01' })
    .expect(201);
  const { body } = await agent.get('/transactions').expect(200);
  expect(body.map(item => item.date)).toEqual(['2026-12-01', '2026-01-01']);
  expect(body[0].type).toBe('income');
});

test('same-day records sort by creation time and ID; editing does not move an older record first', async () => {
  const ids = [1, 2, 3].map(value => new mongoose.Types.ObjectId(value.toString(16).padStart(24, '0')));
  await Transaction.insertMany(
    ids.map((_id, index) => ({
      ...entry,
      _id,
      user: user.id,
      createdAt: new Date(index === 0 ? '2026-10-08T08:00:00Z' : '2026-10-08T09:00:00Z')
    }))
  );
  await agent
    .patch('/transactions/' + ids[0])
    .send({ description: 'Edited later' })
    .expect(200);
  const { body } = await agent.get('/transactions').expect(200);
  expect(body.map(item => item._id)).toEqual([...ids].reverse().map(id => id.toString()));
  expect(body[2].createdAt).toBe('2026-10-08T08:00:00.000Z');
});

test('a PATCH cannot overwrite a concurrent transaction type and category change', async () => {
  const created = await agent.post('/transactions').send(entry).expect(201);
  const findOne = Transaction.findOne.bind(Transaction);
  const read = jest.spyOn(Transaction, 'findOne').mockImplementationOnce(async (...args) => {
    const previous = await findOne(...args);
    await Transaction.updateOne({ _id: created.body._id }, { $set: { type: 'income', category: 'Salary' } });
    return previous;
  });
  try {
    const response = await agent
      .patch('/transactions/' + created.body._id)
      .send({ description: 'A stale description update' })
      .expect(409);
    expect(response.body.message).toBe('Transaction changed. Reload it and try again.');
    const stored = await Transaction.findById(created.body._id);
    expect(stored).toMatchObject({ type: 'income', category: 'Salary', description: entry.description });
  } finally {
    read.mockRestore();
  }
});

test.each([
  ['type', 'other'],
  ['type', null],
  ['amountCents', 0],
  ['amountCents', -1],
  ['amountCents', 1.5],
  ['amountCents', '100'],
  ['amountCents', 1000000000],
  ['amountCents', null],
  ['category', '   '],
  ['category', 'x'.repeat(65)],
  ['category', { $ne: null }],
  ['date', '2026-02-29'],
  ['date', '2026-04-31'],
  ['date', '2026-13-01'],
  ['date', '2026-00-01'],
  ['date', '2026-01-00'],
  ['date', '2026-1-01'],
  ['date', '2026-10-08T00:00:00Z'],
  ['date', '1899-12-31'],
  ['description', 'x'.repeat(501)],
  ['description', 123]
])('create and update reject invalid %s = %j without changing data', async (field, value) => {
  await agent
    .post('/transactions')
    .send({ ...entry, [field]: value })
    .expect(400);
  const created = await agent.post('/transactions').send(entry).expect(201);
  await agent
    .patch('/transactions/' + created.body._id)
    .send({ [field]: value })
    .expect(400);
  const stored = await Transaction.findById(created.body._id);
  expect(stored[field]).toEqual(entry[field]);
});

test.each(['type', 'amountCents', 'category', 'date'])('required field %s cannot be omitted', async field => {
  const body = { ...entry };
  delete body[field];
  await agent.post('/transactions').send(body).expect(400);
});

test('description is optional and whitespace is trimmed', async () => {
  const { description, ...body } = entry;
  expect(description).toBe('Lunch');
  const response = await agent
    .post('/transactions')
    .send({ ...body, category: '  Food  ' })
    .expect(201);
  expect(response.body).toMatchObject({ category: 'Food', description: '' });
});

test('unknown fields, owner injection, operator injection and empty updates are rejected', async () => {
  for (const body of [
    { ...entry, user: user.id },
    { ...entry, extra: true },
    { ...entry, $set: { type: 'income' } }
  ]) {
    await agent.post('/transactions').send(body).expect(400);
  }
  const created = await agent.post('/transactions').send(entry).expect(201);
  await agent
    .patch('/transactions/' + created.body._id)
    .send({})
    .expect(400);
  await agent
    .patch('/transactions/' + created.body._id)
    .send({ user: new mongoose.Types.ObjectId().toString() })
    .expect(400);
  await agent.post('/transactions').send([entry]).expect(400);
});

test('invalid identifiers return 400; missing transactions return 404', async () => {
  const missing = new mongoose.Types.ObjectId().toString();
  for (const method of ['get', 'patch', 'delete']) {
    const body = method === 'patch' ? { category: 'Other' } : {};
    await agent[method]('/transactions/not-an-id').send(body).expect(400);
    await agent[method]('/transactions/' + missing)
      .send(body)
      .expect(404);
  }
});

test('every transaction operation requires authentication', async () => {
  const id = new mongoose.Types.ObjectId().toString();
  await request(app).get('/transactions').expect(401);
  await request(app).post('/transactions').send(entry).expect(401);
  await request(app)
    .get('/transactions/' + id)
    .expect(401);
  await request(app)
    .patch('/transactions/' + id)
    .send({ category: 'Other' })
    .expect(401);
  await request(app)
    .delete('/transactions/' + id)
    .expect(401);
});

test("users cannot list, read, edit or delete someone else's transactions", async () => {
  const created = await agent.post('/transactions').send(entry).expect(201);
  await User.create({ email: 'other@example.com', password: 'testtest', fullname: 'Other User' });
  const other = request.agent(app);
  await other.post('/auth/login').send({ email: 'other@example.com', password: 'testtest' }).expect(200);
  await other.get('/transactions').expect(200, []);
  await other.get('/transactions/' + created.body._id).expect(404);
  await other
    .patch('/transactions/' + created.body._id)
    .send({ amountCents: 9999 })
    .expect(404);
  await other.delete('/transactions/' + created.body._id).expect(404);
  expect((await Transaction.findById(created.body._id)).amountCents).toBe(1234);
});

test('malformed JSON returns 400, and unsupported template routes return 404', async () => {
  const response = await agent
    .post('/transactions')
    .set('Content-Type', 'application/json')
    .send('{"private-description": "not-for-error-output",')
    .expect(400);
  expect(response.body).toEqual({ error: 400, message: 'Request body must contain valid JSON.', data: {} });
  await agent.get('/companies').expect(404);
});
