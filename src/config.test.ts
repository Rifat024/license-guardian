import assert from 'node:assert';
import { test } from 'node:test';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readConfig } from './config';
import { DEFAULT_CONFIG } from './types';

test('readConfig falls back to defaults when no config file exists', async () => {
  const root = await mkdtemp(join(tmpdir(), 'lg-config-'));
  try {
    const config = await readConfig(root);
    assert.deepEqual(config, DEFAULT_CONFIG);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('readConfig merges a partial override file with defaults', async () => {
  const root = await mkdtemp(join(tmpdir(), 'lg-config-'));
  try {
    await writeFile(join(root, '.license-guardian.json'), JSON.stringify({ deny: ['WTFPL'] }), 'utf8');
    const config = await readConfig(root);
    assert.deepEqual(config.deny, ['WTFPL']);
    assert.equal(config.denyUnknown, DEFAULT_CONFIG.denyUnknown);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('readConfig respects an explicit denyUnknown: false', async () => {
  const root = await mkdtemp(join(tmpdir(), 'lg-config-'));
  try {
    await writeFile(join(root, '.license-guardian.json'), JSON.stringify({ denyUnknown: false }), 'utf8');
    const config = await readConfig(root);
    assert.equal(config.denyUnknown, false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
