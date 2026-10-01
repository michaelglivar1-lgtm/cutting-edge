// Routine maintenance checks existing content instead of mass-producing pages.
import { spawnSync } from 'node:child_process';
const result=spawnSync(process.execPath,[new URL('./seo-audit.mjs',import.meta.url).pathname,'--fix'],{stdio:'inherit'});
process.exit(result.status ?? 1);
