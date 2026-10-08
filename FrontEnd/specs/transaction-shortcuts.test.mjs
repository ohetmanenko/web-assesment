import test from 'node:test';
import assert from 'node:assert/strict';
import { transactionShortcut } from '../src/helpers/transaction-shortcuts.mjs';

test('minus and underscore open expense; plus and equals open income', () => {
  for (const key of ['-', '_']) assert.equal(transactionShortcut({ key }), 'expense');
  for (const key of ['+', '=']) assert.equal(transactionShortcut({ key }), 'income');
});
test('browser modifiers, repeated keys and composition are ignored', () => {
  for (const flag of ['ctrlKey', 'altKey', 'metaKey', 'repeat', 'isComposing', 'defaultPrevented']) {
    assert.equal(transactionShortcut({ key: '+', [flag]: true }), null);
  }
  assert.equal(transactionShortcut({ key: '_', shiftKey: true }), 'expense');
});
test('editable or dialog targets do not trigger diary shortcuts', () => {
  assert.equal(transactionShortcut({ key: '-', target: { closest: () => ({}) } }), null);
  assert.equal(transactionShortcut({ key: '-', target: { closest: () => null } }), 'expense');
});
test('unrelated keys do not open a form', () => {
  for (const key of ['1', 'Escape', 'Enter', 'a']) assert.equal(transactionShortcut({ key }), null);
});
