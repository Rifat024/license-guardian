import assert from 'node:assert';
import { test } from 'node:test';
import { scanToMarkdown } from './report';
import type { PackageLicense } from './types';

const gplPkg: PackageLicense = { name: 'copyleft-lib', version: '3.2.1', license: 'GPL-3.0', path: '/node_modules/copyleft-lib' };

test('scanToMarkdown reports a clean scan', () => {
  const md = scanToMarkdown({ packages: [], flagged: [], unapproved: [] });
  assert.match(md, /No unapproved licenses found/);
});

test('scanToMarkdown lists unapproved packages with their license', () => {
  const md = scanToMarkdown({ packages: [gplPkg], flagged: [gplPkg], unapproved: [gplPkg] });
  assert.match(md, /copyleft-lib@3\.2\.1/);
  assert.match(md, /`GPL-3\.0`/);
});
