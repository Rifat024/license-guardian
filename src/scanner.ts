import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import type { PackageLicense } from './types';

interface PackageJsonShape {
  name?: string;
  version?: string;
  license?: string | { type?: string };
  licenses?: Array<{ type?: string }>;
}

function normalizeLicense(pkg: PackageJsonShape): string {
  if (typeof pkg.license === 'string' && pkg.license.trim()) return pkg.license.trim();
  if (pkg.license && typeof pkg.license === 'object' && pkg.license.type) return pkg.license.type;
  if (Array.isArray(pkg.licenses) && pkg.licenses.length > 0) {
    const types = pkg.licenses.map((l) => l.type).filter(Boolean);
    if (types.length > 0) return `(${types.join(' OR ')})`;
  }
  return 'UNKNOWN';
}

/**
 * Walks every node_modules directory under `root` (including nested ones
 * from hoisting/version conflicts) and records each package's declared
 * license. Dedupes on realpath to avoid re-scanning symlinked packages
 * (pnpm) or looping on symlink cycles.
 */
export async function scanNodeModules(root: string): Promise<PackageLicense[]> {
  const packages: PackageLicense[] = [];
  const visited = new Set<string>();
  await walk(join(root, 'node_modules'), packages, visited);
  return packages;
}

async function walk(dir: string, packages: PackageLicense[], visited: Set<string>): Promise<void> {
  let real: string;
  try {
    real = await fs.realpath(dir);
  } catch {
    return;
  }
  if (visited.has(real)) return;
  visited.add(real);

  let children: string[];
  try {
    children = await fs.readdir(dir);
  } catch {
    return;
  }

  for (const child of children) {
    if (child === '.bin') continue;
    const childPath = join(dir, child);

    if (child.startsWith('@')) {
      let scopedChildren: string[];
      try {
        scopedChildren = await fs.readdir(childPath);
      } catch {
        continue;
      }
      for (const scopedChild of scopedChildren) {
        await readPackage(join(childPath, scopedChild), packages);
        await descendNested(join(childPath, scopedChild), packages, visited);
      }
      continue;
    }

    await readPackage(childPath, packages);
    await descendNested(childPath, packages, visited);
  }
}

async function descendNested(packageDir: string, packages: PackageLicense[], visited: Set<string>): Promise<void> {
  const nested = join(packageDir, 'node_modules');
  const stat = await safeStat(nested);
  if (stat?.isDirectory()) {
    await walk(nested, packages, visited);
  }
}

async function readPackage(packageDir: string, packages: PackageLicense[]): Promise<void> {
  const pkgJsonPath = join(packageDir, 'package.json');
  const stat = await safeStat(pkgJsonPath);
  if (!stat?.isFile()) return;

  let pkg: PackageJsonShape;
  try {
    pkg = JSON.parse(await fs.readFile(pkgJsonPath, 'utf8'));
  } catch {
    return;
  }
  if (!pkg.name || !pkg.version) return;

  packages.push({ name: pkg.name, version: pkg.version, license: normalizeLicense(pkg), path: packageDir });
}

async function safeStat(path: string) {
  try {
    return await fs.stat(path);
  } catch {
    return undefined;
  }
}
