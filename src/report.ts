import type { PackageLicense, ScanResult } from './types';

function line(pkg: PackageLicense): string {
  return `- **${pkg.name}@${pkg.version}** — \`${pkg.license}\``;
}

export function scanToMarkdown(result: ScanResult): string {
  const lines = [
    '# license-guardian scan report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    `Packages scanned: ${result.packages.length}`,
    `Flagged: ${result.flagged.length}`,
    `Unapproved: ${result.unapproved.length}`,
    '',
  ];

  if (result.unapproved.length === 0) {
    lines.push('No unapproved licenses found.');
    return lines.join('\n');
  }

  lines.push(
    '## Unapproved licenses',
    '',
    'These packages have a copyleft, unrecognized, or missing license and are',
    'not yet in your allowlist. Review each one for your project\'s license',
    'compatibility, then run `license-guardian approve` if it is acceptable.',
    '',
    ...result.unapproved.map(line),
  );

  return lines.join('\n');
}
