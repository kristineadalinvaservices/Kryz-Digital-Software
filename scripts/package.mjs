/** Zips dist/ into release/ with a SHA-256 checksum and a CycloneDX SBOM. Never uploads anything. */
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { version } = JSON.parse(readFileSync(resolve(root, 'dist/manifest.json'), 'utf8'));
const out = resolve(root, 'release');
mkdirSync(out, { recursive: true });
const zip = resolve(out, `kryz-quick-reply-v${version}.zip`);
if (existsSync(zip)) rmSync(zip);
execSync(`zip -r -X -q "${zip}" .`, { cwd: resolve(root, 'dist') });
const sha = createHash('sha256').update(readFileSync(zip)).digest('hex');
writeFileSync(`${zip}.sha256`, `${sha}  kryz-quick-reply-v${version}.zip\n`);
const sbom = execSync('npm sbom --sbom-format cyclonedx --omit dev', { cwd: root }).toString();
writeFileSync(resolve(out, `sbom-v${version}.cdx.json`), sbom);
console.log(`Packaged ${zip}\nSHA-256 ${sha}`);
