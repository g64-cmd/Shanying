import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const required = ['README.md', 'AGENTS.md', 'backend/AGENTS.md', 'frontend/AGENTS.md', 'android/AGENTS.md', 'contracts/openapi.yaml', 'docs/api/README.md', 'docs/requirements.md', 'docs/workflow.md', 'openspec/config.yaml'];
const failures = [];
for (const path of required) if (!existsSync(new URL('../' + path, import.meta.url))) failures.push('Missing: ' + path);
for (const area of ['backend', 'frontend', 'android']) {
  if (existsSync(new URL('../' + area + '/.git', import.meta.url))) failures.push('Nested Git repository: ' + area);
}
const ignored = execFileSync('git', ['check-ignore', '.worktree/probe'], { cwd: root, encoding: 'utf8' }).trim();
if (!ignored) failures.push('.worktree must be ignored');
const contract = readFileSync(new URL('../contracts/openapi.yaml', import.meta.url), 'utf8');
if (!contract.startsWith('openapi: 3.0.3')) failures.push('Unexpected contract format');
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }
else console.log('Repository structure checks passed (not application or OpenAPI schema validation).');
