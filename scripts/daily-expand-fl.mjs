// Cutting Edge daily expansion: release ONE queued FL service/day, then build-fl
// (which generates its cost guide + all pages). Backlog empty → freshness rebuild.
import { readFile, writeFile } from 'node:fs/promises';
import { execSync } from 'node:child_process';
const HERE = new URL('.', import.meta.url);
const R = (p) => new URL('../' + p, HERE);

const services = JSON.parse(await readFile(R('data/fl-services.json')));
let backlog = [];
try { backlog = JSON.parse(await readFile(R('data/fl-services-backlog.json'))); } catch {}

if (backlog.length) {
  const svc = backlog.shift();
  services.push(svc);
  await writeFile(R('data/fl-services.json'), JSON.stringify(services, null, 2));
  await writeFile(R('data/fl-services-backlog.json'), JSON.stringify(backlog, null, 2));
  console.log(`RELEASED: ${svc.slug}. Backlog remaining: ${backlog.length}`);
} else {
  console.log('backlog empty — freshness rebuild');
}
execSync('node scripts/build-fl.mjs', { cwd: new URL('..', HERE).pathname, stdio: 'inherit' });
