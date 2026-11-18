'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { rng, sha256 } = require('../src/shared/lib');

test('the seeded generator gives the same numbers every time', () => {
  const a = rng(20261118); const b = rng(20261118);
  const xs = Array.from({ length: 5 }, a); const ys = Array.from({ length: 5 }, b);
  assert.deepStrictEqual(xs, ys);
  assert.ok(xs.every((x) => x >= 0 && x < 1));
  assert.notDeepStrictEqual(xs, Array.from({ length: 5 }, rng(1)));
});

test('sha256 of a known string', () => {
  assert.strictEqual(sha256('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});
