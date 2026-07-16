import assert from 'node:assert';
import { test } from 'node:test';
import { isDenied, flagPackages } from './match';
import { DEFAULT_CONFIG } from './types';
import type { PackageLicense } from './types';

const pkg = (name: string, license: string): PackageLicense => ({ name, version: '1.0.0', license, path: `/node_modules/${name}` });

test('permissive licenses are not denied', () => {
  assert.equal(isDenied(pkg('a', 'MIT'), DEFAULT_CONFIG), false);
  assert.equal(isDenied(pkg('b', 'Apache-2.0'), DEFAULT_CONFIG), false);
  assert.equal(isDenied(pkg('c', 'ISC'), DEFAULT_CONFIG), false);
  assert.equal(isDenied(pkg('d', 'BSD-3-Clause'), DEFAULT_CONFIG), false);
});

test('strong copyleft licenses are denied', () => {
  assert.equal(isDenied(pkg('a', 'GPL-3.0'), DEFAULT_CONFIG), true);
  assert.equal(isDenied(pkg('b', 'AGPL-3.0'), DEFAULT_CONFIG), true);
  assert.equal(isDenied(pkg('c', 'LGPL-2.1'), DEFAULT_CONFIG), true);
  assert.equal(isDenied(pkg('d', 'SSPL-1.0'), DEFAULT_CONFIG), true);
});

test('a dual-license expression mentioning a denied license is flagged', () => {
  assert.equal(isDenied(pkg('a', '(MIT OR GPL-3.0)'), DEFAULT_CONFIG), true);
});

test('UNKNOWN is denied by default (denyUnknown: true)', () => {
  assert.equal(isDenied(pkg('a', 'UNKNOWN'), DEFAULT_CONFIG), true);
});

test('UNKNOWN is allowed when denyUnknown is false', () => {
  assert.equal(isDenied(pkg('a', 'UNKNOWN'), { ...DEFAULT_CONFIG, denyUnknown: false }), false);
});

test('a custom deny list only flags what it specifies', () => {
  const config = { deny: ['WTFPL'], denyUnknown: false };
  assert.equal(isDenied(pkg('a', 'WTFPL'), config), true);
  assert.equal(isDenied(pkg('b', 'GPL-3.0'), config), false);
});

test('flagPackages returns only the denied subset', () => {
  const packages = [pkg('a', 'MIT'), pkg('b', 'GPL-3.0'), pkg('c', 'UNKNOWN')];
  const flagged = flagPackages(packages, DEFAULT_CONFIG);
  assert.deepEqual(flagged.map((p) => p.name).sort(), ['b', 'c']);
});
