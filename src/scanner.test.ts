import assert from 'node:assert';
import { test } from 'node:test';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { scanNodeModules } from './scanner';

async function makePackage(nodeModulesDir: string, name: string, version: string, pkgJsonExtra: Record<string, unknown>) {
  const dir = join(nodeModulesDir, ...name.split('/'));
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'package.json'), JSON.stringify({ name, version, ...pkgJsonExtra }), 'utf8');
  return dir;
}

test('scanNodeModules reads a plain string license field', async () => {
  const root = await mkdtemp(join(tmpdir(), 'lg-'));
  try {
    await makePackage(join(root, 'node_modules'), 'mit-pkg', '1.0.0', { license: 'MIT' });
    const packages = await scanNodeModules(root);
    assert.equal(packages.length, 1);
    assert.equal(packages[0].license, 'MIT');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('scanNodeModules reads legacy object license field', async () => {
  const root = await mkdtemp(join(tmpdir(), 'lg-'));
  try {
    await makePackage(join(root, 'node_modules'), 'legacy-pkg', '1.0.0', { license: { type: 'ISC' } });
    const packages = await scanNodeModules(root);
    assert.equal(packages[0].license, 'ISC');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('scanNodeModules reads legacy licenses array', async () => {
  const root = await mkdtemp(join(tmpdir(), 'lg-'));
  try {
    await makePackage(join(root, 'node_modules'), 'dual-pkg', '1.0.0', { licenses: [{ type: 'MIT' }, { type: 'Apache-2.0' }] });
    const packages = await scanNodeModules(root);
    assert.equal(packages[0].license, '(MIT OR Apache-2.0)');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('scanNodeModules marks a missing license as UNKNOWN', async () => {
  const root = await mkdtemp(join(tmpdir(), 'lg-'));
  try {
    await makePackage(join(root, 'node_modules'), 'no-license-pkg', '1.0.0', {});
    const packages = await scanNodeModules(root);
    assert.equal(packages[0].license, 'UNKNOWN');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('scanNodeModules descends into nested node_modules and handles scoped packages', async () => {
  const root = await mkdtemp(join(tmpdir(), 'lg-'));
  try {
    const nm = join(root, 'node_modules');
    await makePackage(nm, '@scope/pkg', '2.0.0', { license: 'Apache-2.0' });
    const outerDir = await makePackage(nm, 'outer', '1.0.0', { license: 'MIT' });
    await makePackage(join(outerDir, 'node_modules'), 'inner', '9.9.9', { license: 'GPL-3.0' });

    const packages = await scanNodeModules(root);
    const byName = Object.fromEntries(packages.map((p) => [p.name, p.license]));
    assert.deepEqual(byName, { '@scope/pkg': 'Apache-2.0', outer: 'MIT', inner: 'GPL-3.0' });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('scanNodeModules returns empty list when node_modules is missing', async () => {
  const root = await mkdtemp(join(tmpdir(), 'lg-'));
  try {
    assert.deepEqual(await scanNodeModules(root), []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
