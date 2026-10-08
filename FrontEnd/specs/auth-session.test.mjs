import assert from 'node:assert/strict';
import { test } from 'node:test';
import axios, { AxiosError } from 'axios';
import { createAuthSession } from '../src/helpers/core/session.mjs';

const deferred = () => {
  let resolve;
  const promise = new Promise(done => {
    resolve = done;
  });
  return { promise, resolve };
};
const response = (config, data = {}, status = 200) => ({ config, data, status, statusText: '', headers: {} });
const failure = (config, status) => {
  throw new AxiosError('Request failed', undefined, config, undefined, response(config, {}, status));
};
const setup = adapter => {
  const events = [];
  const api = axios.create({ adapter });
  const session = createAuthSession(api, {
    onSignedIn: user => events.push(['in', user]),
    onSignedOut: () => events.push(['out'])
  });
  return { api, session, events };
};

test('concurrent expired requests share one refresh and retry with the refreshed session', async () => {
  const refreshing = deferred();
  const finishRefresh = deferred();
  let refreshes = 0;
  const { api, events } = setup(async config => {
    if (config.url === '/auth/rt') {
      assert.equal(config.method, 'post');
      refreshes++;
      refreshing.resolve();
      await finishRefresh.promise;
      return response(config, { fullname: 'User' });
    }
    if (!config.retried) return failure(config, 401);
    return response(config, config.url);
  });
  const first = api.get('/transactions');
  const second = api.get('/categories');
  await refreshing.promise;
  finishRefresh.resolve();
  const results = await Promise.all([first, second]);
  assert.equal(refreshes, 1);
  assert.deepEqual(
    results.map(result => result.data),
    ['/transactions', '/categories']
  );
  assert.deepEqual(events, [['in', { fullname: 'User' }]]);
});

test('business request failure after successful refresh preserves authentication', async () => {
  const { api, events } = setup(async config => {
    if (config.url === '/auth/rt') return response(config, { fullname: 'User' });
    return failure(config, config.retried ? 500 : 401);
  });
  await assert.rejects(api.get('/transactions'), error => error.response.status === 500);
  assert.deepEqual(events, [['in', { fullname: 'User' }]]);
});

test('rejected refresh signs out without retrying indefinitely', async () => {
  let refreshes = 0;
  const { api, events } = setup(async config => {
    if (config.url === '/auth/rt') refreshes++;
    return failure(config, 401);
  });
  await assert.rejects(api.get('/transactions'), error => error.response.status === 401);
  assert.equal(refreshes, 1);
  assert.deepEqual(events, [['out']]);
});

test('temporary refresh failure preserves the session and can recover on the next request', async () => {
  let refreshes = 0;
  const { api, events } = setup(async config => {
    if (config.url === '/auth/rt') {
      if (++refreshes === 1) return failure(config, 503);
      return response(config, { fullname: 'User' });
    }
    if (!config.retried) return failure(config, 401);
    return response(config, []);
  });
  await assert.rejects(api.get('/transactions'), error => error.response.status === 503);
  assert.deepEqual(events, []);
  await api.get('/transactions');
  assert.equal(refreshes, 2);
  assert.deepEqual(events, [['in', { fullname: 'User' }]]);
});

test('logout waits for pending refresh and prevents stale refresh from restoring authentication', async () => {
  const refreshing = deferred();
  const finishRefresh = deferred();
  const calls = [];
  const { api, session, events } = setup(async config => {
    calls.push(config.url);
    if (config.url === '/auth/rt') {
      refreshing.resolve();
      await finishRefresh.promise;
      return response(config, { fullname: 'User' });
    }
    if (config.url === '/auth/logout') {
      assert.equal(config.method, 'post');
      return response(config);
    }
    return failure(config, 401);
  });
  const request = assert.rejects(api.get('/transactions'), error => error.response.status === 401);
  await refreshing.promise;
  const logout = session.signOut();
  assert.ok(!calls.includes('/auth/logout'));
  finishRefresh.resolve();
  await Promise.all([request, logout]);
  assert.deepEqual(calls, ['/transactions', '/auth/rt', '/auth/logout']);
  assert.deepEqual(events, [['out']]);
});

test('stale session check cannot replace a newer login', async () => {
  const checking = deferred();
  const finishCheck = deferred();
  const { session, events } = setup(async config => {
    if (config.url === '/auth/check') {
      checking.resolve();
      await finishCheck.promise;
      return response(config, { fullname: 'Previous user' });
    }
    return response(config, { fullname: 'Current user' });
  });
  const check = session.check();
  await checking.promise;
  await session.signIn('current@example.com', 'password');
  finishCheck.resolve();
  await check;
  assert.deepEqual(events, [['in', { fullname: 'Current user' }]]);
});

test('disposed provider ignores pending results and removes its interceptors', async () => {
  const checking = deferred();
  const finishCheck = deferred();
  const { session, api, events } = setup(async config => {
    checking.resolve();
    await finishCheck.promise;
    return response(config, { fullname: 'User' });
  });
  const check = session.check();
  await checking.promise;
  session.dispose();
  finishCheck.resolve();
  await check;
  assert.deepEqual(events, []);
  assert.ok(api.interceptors.request.handlers.every(handler => handler === null));
  assert.ok(api.interceptors.response.handlers.every(handler => handler === null));
});
