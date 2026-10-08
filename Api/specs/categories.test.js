const request = require('supertest');
const app = require('../app');
const db = require('./database');
const User = require('../models/user');
const Category = require('../models/category');
const Transaction = require('../models/transaction');

const entry = { type: 'expense', amountCents: 1234, category: 'Other', date: '2026-10-08' };
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

test('category catalog requires authentication and separates presets by transaction type', async () => {
  await request(app).get('/categories').expect(401);
  const { body } = await agent.get('/categories').expect(200);
  expect(body.defaults.expense).toContain('Transport');
  expect(body.defaults.income).toContain('Salary');
  expect(body.defaults.income).not.toContain('Transport');
  expect(body.custom).toEqual({ expense: [], income: [] });
});

test('Other accepts an optional name, normalizes Title Case and reuses one persisted category', async () => {
  const created = await agent
    .post('/transactions')
    .send({ ...entry, customCategoryName: '  pET   care  ' })
    .expect(201);
  expect(created.body.category).toBe('Pet Care');
  expect(created.body).not.toHaveProperty('customCategoryName');
  expect((await Transaction.findById(created.body._id)).category).toBe('Pet Care');
  await agent
    .post('/transactions')
    .send({ ...entry, customCategoryName: 'pet care' })
    .expect(201);
  const categories = await Category.find({ user: user.id });
  expect(categories).toHaveLength(1);
  expect(categories[0]).toMatchObject({ type: 'expense', name: 'Pet Care' });
  const { body } = await agent.get('/categories').expect(200);
  expect(body.custom).toEqual({ expense: ['Pet Care'], income: [] });
});

test.each([undefined, '', '   '])('Other without a name stays Other (%j)', async customCategoryName => {
  const created = await agent
    .post('/transactions')
    .send({ ...entry, customCategoryName })
    .expect(201);
  expect(created.body.category).toBe('Other');
  expect(await Category.countDocuments()).toBe(0);
});

test('a custom category remains reusable after its last transaction is deleted', async () => {
  const created = await agent
    .post('/transactions')
    .send({ ...entry, customCategoryName: 'pet care' })
    .expect(201);
  await agent.delete('/transactions/' + created.body._id).expect(200);
  const { body } = await agent.get('/categories').expect(200);
  expect(body.custom.expense).toEqual(['Pet Care']);
  const reused = await agent
    .post('/transactions')
    .send({ ...entry, category: 'Pet Care' })
    .expect(201);
  expect(reused.body.category).toBe('Pet Care');
  expect(await Category.countDocuments()).toBe(1);
});

test('editing can create a new category and keep both names available', async () => {
  const created = await agent
    .post('/transactions')
    .send({ ...entry, customCategoryName: 'pet care' })
    .expect(201);
  const updated = await agent
    .patch('/transactions/' + created.body._id)
    .send({ category: 'Other', customCategoryName: '  dOg-walking  ' })
    .expect(200);
  expect(updated.body.category).toBe('Dog-Walking');
  const { body } = await agent.get('/categories').expect(200);
  expect(body.custom.expense).toEqual(['Dog-Walking', 'Pet Care']);
});

test.each([
  { type: 'income', category: 'Transport' },
  { type: 'income', category: 'Food & drinks' },
  { type: 'expense', category: 'Salary' },
  { type: 'expense', category: 'Other', customCategoryName: 'sALaRY' }
])('presets of another type are rejected on create and update: %j', async invalid => {
  await agent
    .post('/transactions')
    .send({ ...entry, ...invalid })
    .expect(400);
  const created = await agent.post('/transactions').send(entry).expect(201);
  await agent
    .patch('/transactions/' + created.body._id)
    .send(invalid)
    .expect(400);
  expect((await Transaction.findById(created.body._id)).type).toBe('expense');
  expect(await Category.countDocuments()).toBe(0);
});

test('switching type cannot silently retain a custom category belonging to the previous type', async () => {
  const created = await agent
    .post('/transactions')
    .send({ ...entry, customCategoryName: 'pet care' })
    .expect(201);
  for (const update of [{ type: 'income' }, { type: 'income', category: 'Pet Care' }]) {
    await agent
      .patch('/transactions/' + created.body._id)
      .send(update)
      .expect(400);
  }
  expect((await Transaction.findById(created.body._id)).type).toBe('expense');
  await agent
    .patch('/transactions/' + created.body._id)
    .send({ type: 'income', category: 'Salary' })
    .expect(200);
});

test('shared Other and an explicitly registered custom name can be retained across types', async () => {
  const other = await agent.post('/transactions').send(entry).expect(201);
  await agent
    .patch('/transactions/' + other.body._id)
    .send({ type: 'income' })
    .expect(200);
  const expense = await agent
    .post('/transactions')
    .send({ ...entry, customCategoryName: 'side project' })
    .expect(201);
  await agent
    .post('/transactions')
    .send({ ...entry, type: 'income', customCategoryName: 'side project' })
    .expect(201);
  const updated = await agent
    .patch('/transactions/' + expense.body._id)
    .send({ type: 'income' })
    .expect(200);
  expect(updated.body.category).toBe('Side Project');
});

test.each([
  { customCategoryName: 'x'.repeat(65) },
  { customCategoryName: { $ne: null } },
  { customCategoryName: 'ß'.repeat(64) },
  { category: 'Transport', customCategoryName: 'Pet Care' }
])('invalid custom names never create categories: %j', async invalid => {
  await agent
    .post('/transactions')
    .send({ ...entry, ...invalid })
    .expect(400);
  expect(await Transaction.countDocuments()).toBe(0);
  expect(await Category.countDocuments()).toBe(0);
});

test('a same-type preset entered under Other uses the preset instead of creating a duplicate', async () => {
  const { body } = await agent
    .post('/transactions')
    .send({ ...entry, customCategoryName: ' food & DRINKS ' })
    .expect(201);
  expect(body.category).toBe('Food & drinks');
  expect(await Category.countDocuments()).toBe(0);
});

test('custom categories from older transactions are included without a migration', async () => {
  await Transaction.create({ ...entry, user: user.id, category: 'old   pet care' });
  const { body } = await agent.get('/categories').expect(200);
  expect(body.custom.expense).toContain('Old Pet Care');
});

test("custom categories are private to the current user and cannot validate another user's type switch", async () => {
  await agent
    .post('/transactions')
    .send({ ...entry, type: 'income', customCategoryName: 'private royalties' })
    .expect(201);
  const otherUser = await User.create({ email: 'other@example.com', password: 'testtest', fullname: 'Other User' });
  const other = request.agent(app);
  await other.post('/auth/login').send({ email: otherUser.email, password: 'testtest' }).expect(200);
  const catalog = await other.get('/categories').expect(200);
  expect(catalog.body.custom).toEqual({ expense: [], income: [] });
  const created = await other
    .post('/transactions')
    .send({ ...entry, customCategoryName: 'private royalties' })
    .expect(201);
  await other
    .patch('/transactions/' + created.body._id)
    .send({ type: 'income' })
    .expect(400);
});
