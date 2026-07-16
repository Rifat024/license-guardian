import assert from 'node:assert';
import { test } from 'node:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readBaseline, writeBaseline, diffAgainstBaseline, mergeIntoBaseline } from './baseline';
import type { PackageLicense } from './types';

const pkg = (name: string, version: string, license = 'GPL-3.0'): PackageLicense => ({ name, version, license, path: `/node_modules/${name}` });

test('readBaseline returns an empty baseline when the file does not exist', async () => {
  const root = await mkdtemp(join(tmpdir(), 'lg-baseline-'));
  try {
    assert.deepEqual(await readBaseline(root), { approved: [] });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('writeBaseline then readBaseline round-trips and dedupes/sorts', async () => {
  const root = await mkdtemp(join(tmpdir(), 'lg-baseline-'));
  try {
    await writeBaseline(root, { approved: ['b@1.0.0', 'a@1.0.0', 'a@1.0.0'] });
    const baseline = await readBaseline(root);
    assert.deepEqual(baseline.approved, ['a@1.0.0', 'b@1.0.0']);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('diffAgainstBaseline returns only unapproved flagged packages', () => {
  const flagged = [pkg('foo', '1.0.0'), pkg('bar', '2.0.0')];
  const unapproved = diffAgainstBaseline(flagged, { approved: ['foo@1.0.0'] });
  assert.equal(unapproved.length, 1);
  assert.equal(unapproved[0].name, 'bar');
});

test('a version bump re-flags a previously-approved package', () => {
  const unapproved = diffAgainstBaseline([pkg('foo', '2.0.0')], { approved: ['foo@1.0.0'] });
  assert.equal(unapproved.length, 1);
});

test('mergeIntoBaseline adds without duplicating', () => {
  const merged = mergeIntoBaseline({ approved: ['foo@1.0.0'] }, [pkg('foo', '1.0.0'), pkg('bar', '2.0.0')]);
  assert.deepEqual([...merged.approved].sort(), ['bar@2.0.0', 'foo@1.0.0']);
});
