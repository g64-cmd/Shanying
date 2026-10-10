import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const failures = [];
const requiredFiles = [
  'AGENTS.md', 'README.md', 'LICENSE', '.editorconfig', '.gitattributes',
  '.gitignore', '.node-version', '.github/workflows/repository.yml',
  'docs/development.md', 'docs/dependency-baseline.md',
  'docs/adr/README.md', 'docs/benchmarks/README.md',
  'server/README.md', 'server/cmd/api/README.md', 'server/cmd/worker/README.md',
  'server/internal/bootstrap/README.md', 'server/internal/platform/README.md',
  'server/internal/modules/README.md', 'server/migrations/README.md',
  'apps/web/README.md', 'apps/android/README.md',
  'contracts/README.md', 'contracts/http/README.md',
  'contracts/realtime/README.md', 'contracts/events/README.md',
  'contracts/examples/README.md', 'packages/api-client-web/README.md',
  'deploy/README.md', 'scripts/README.md', 'scripts/check-repository.mjs',
  'tests/README.md', 'tests/contract/README.md',
  'tests/e2e/README.md', 'tests/load/README.md',
];

for (const file of requiredFiles) {
  try {
    if (!statSync(path.join(root, file)).isFile()) throw new Error('不是文件');
  } catch (error) {
    failures.push(`${file}: 必须存在职责/检查入口 (${error.message})`);
  }
}

const versionFile = path.join(root, '.node-version');
let expectedNode;
try {
  expectedNode = readFileSync(versionFile, 'utf8').trim();
  if (!/^24\.\d+\.\d+$/.test(expectedNode)) {
    failures.push('.node-version: 必须固定 Node 24 的完整版本');
  }
  if (process.versions.node !== expectedNode) {
    failures.push(`Node 版本为 ${process.versions.node}，请使用 ${expectedNode}`);
  }
} catch (error) {
  failures.push(`.node-version: 无法读取 (${error.message})`);
}

const files = [...new Set(execFileSync('git', [
  '-c', 'core.excludesFile=', 'ls-files', '--cached', '--others',
  '--exclude-standard', '-z',
], { cwd: root, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 })
  .split('\0').filter(Boolean))];

let markdownCount = 0;
let linkCount = 0;
let jsonCount = 0;
const decoder = new TextDecoder('utf-8', { fatal: true });

for (const file of files) {
  if (file.split('/').includes('commerce')) {
    failures.push(`${file}: v2 不创建 commerce 目录`);
  }
  if (!(file === 'LICENSE' || file.startsWith('.editorconfig') ||
    file.startsWith('.gitattributes') || file.startsWith('.gitignore') ||
    file === '.node-version' || /\.(md|mjs|json|ya?ml)$/.test(file))) continue;

  let text;
  try {
    const bytes = readFileSync(path.join(root, file));
    if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
      failures.push(`${file}: 使用 UTF-8 无 BOM`);
    }
    text = decoder.decode(bytes);
  } catch (error) {
    failures.push(`${file}: 无法作为 UTF-8 文本读取 (${error.message})`);
    continue;
  }
  if (!text.endsWith('\n')) failures.push(`${file}: 缺少结尾换行`);

  if (file.endsWith('.json')) {
    try {
      JSON.parse(text);
      jsonCount += 1;
    } catch (error) {
      failures.push(`${file}: JSON 语法错误 (${error.message})`);
    }
  }
  if (!file.endsWith('.md')) continue;
  markdownCount += 1;

  for (const match of text.matchAll(/^```json[^\S\r\n]*\r?\n([\s\S]*?)^```[^\S\r\n]*$/gm)) {
    const line = text.slice(0, match.index).split('\n').length;
    try {
      JSON.parse(match[1]);
      jsonCount += 1;
    } catch (error) {
      failures.push(`${file}:${line}: JSON 示例语法错误 (${error.message})`);
    }
  }

  const prose = text.replace(/^```[^\n]*\n[\s\S]*?^```[^\n]*$/gm, '')
    .replace(/`[^`\r\n]*`/g, '');
  for (const match of prose.matchAll(/\[[^\]\r\n]*\]\((<[^>\r\n]+>|[^)\s]+)(?:\s+"[^"]*")?\)/g)) {
    const href = match[1].replace(/^<|>$/g, '');
    if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(href)) continue;
    try {
      const target = decodeURIComponent(href.split(/[?#]/)[0]);
      const absolute = target.startsWith('/')
        ? path.resolve(root, `.${target}`)
        : path.resolve(path.dirname(path.join(root, file)), target);
      const relative = path.relative(root, absolute);
      if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
        throw new Error('目标超出仓库');
      }
      statSync(absolute);
      linkCount += 1;
    } catch (error) {
      failures.push(`${file}: 相对链接 ${href} 不可用 (${error.message})`);
    }
  }
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`FAIL ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`PASS 仓库结构：${requiredFiles.length} 个必需入口`);
  console.log(`PASS 文档：${markdownCount} 个 Markdown，${linkCount} 个本地链接，${jsonCount} 个 JSON 示例/文件`);
  console.log(`PASS 文本与范围检查；Node ${expectedNode}`);
  console.log('检查范围为仓库基底；未执行三端构建、契约校验或 P0 探针。');
}
