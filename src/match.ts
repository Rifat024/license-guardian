import type { Config, PackageLicense } from './types';

/**
 * Substring match against the license string (case-insensitive, word-ish
 * boundary). A dual-license expression like "(MIT OR GPL-3.0)" is flagged
 * for review even though the MIT side alone would be fine — the tool can't
 * know which side a consumer will actually rely on, so it errs conservative.
 */
export function isDenied(pkg: PackageLicense, config: Config): boolean {
  if (pkg.license === 'UNKNOWN') return config.denyUnknown;
  const license = pkg.license.toLowerCase();
  return config.deny.some((entry) => license.includes(entry.toLowerCase()));
}

export function flagPackages(packages: PackageLicense[], config: Config): PackageLicense[] {
  return packages.filter((pkg) => isDenied(pkg, config));
}
