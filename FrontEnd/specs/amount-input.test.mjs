import test from 'node:test';
import assert from 'node:assert/strict';
import { formatCentsInput, parsePastedAmount, centsToInput } from '../src/helpers/amount-input.mjs';

test('digits accumulate from cents without a decimal key', () => {
  let value = '';
  for (const [digit, expected] of [
    ['1', '0.01'],
    ['5', '0.15'],
    ['6', '1.56'],
    ['4', '15.64']
  ]) {
    value = formatCentsInput(value + digit, value);
    assert.equal(value, expected);
  }
});
test('backspace reverses the sequence and clearing stays empty', () => {
  let value = '15.64';
  for (const expected of ['1.56', '0.15', '0.01', '0.00']) {
    value = formatCentsInput(value.slice(0, -1), value);
    assert.equal(value, expected);
  }
  assert.equal(formatCentsInput(''), '');
});
test('zero and leading zeros do not shift the intended cents', () => {
  assert.equal(formatCentsInput('0001564'), '15.64');
  assert.equal(formatCentsInput('0'), '0.00');
});
test('invalid characters preserve the previous value', () => {
  for (const raw of ['1.56a', '-1', '1e2', '1.2.3']) assert.equal(formatCentsInput(raw, '1.56'), '1.56');
});
test('maximum and overflow preserve the API amount boundary', () => {
  assert.equal(formatCentsInput('999999999'), '9999999.99');
  assert.equal(formatCentsInput('9999999990', '9999999.99'), '9999999.99');
});
test('paste accepts cents digits and explicit decimal amounts', () => {
  assert.equal(parsePastedAmount('1564'), '15.64');
  assert.equal(parsePastedAmount(' 15.64 '), '15.64');
  assert.equal(parsePastedAmount('15,64'), '15.64');
  assert.equal(parsePastedAmount('15.6'), '15.60');
});
test('paste rejects excess precision and malformed amounts', () => {
  for (const raw of ['12.345', '-12.34', 'abc', '1,234.56', '', '10000000.00']) {
    assert.equal(parsePastedAmount(raw, '1.56'), '1.56');
  }
});
test('existing amounts retain their value until further digit entry', () => {
  assert.equal(centsToInput(1234), '12.34');
  assert.equal(formatCentsInput('12.345', '12.34'), '123.45');
});
