import { spawnSync } from 'child_process';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';

const AGENTS = {
  agy: findAgy,
  claude: () => findBin('claude'),
  codex: () => findBin('codex'),
};

function findBin(name) {
  for (const cmd of [name, `${name}.cmd`, `${name}.exe`]) {
    const result = spawnSync('where', [cmd], { encoding: 'utf8', shell: true });
    if (result.status === 0) return result.stdout.trim().split('\n')[0].trim();
  }
  return name;
}

function findAgy() {
  for (const cmd of ['agy', 'agy.exe', 'antigravity', 'antigravity.cmd']) {
    const result = spawnSync('where', [cmd], { encoding: 'utf8', shell: true });
    if (result.status === 0) return result.stdout.trim().split('\n')[0].trim();
  }
  return 'agy';
}

export function runAgent(prompt, workDir, agentName = 'agy', timeout = 600000) {
  const agentBin = (AGENTS[agentName] || (() => agentName))();

  // Write prompt to temp file (avoids shell escaping issues)
  const tmpFile = join(tmpdir(), `agy-kit-${randomBytes(4).toString('hex')}.txt`);
  writeFileSync(tmpFile, prompt, 'utf8');

  // Use PowerShell on Windows to get proper console context for agy
  const isWindows = process.platform === 'win32';
  let result;

  if (isWindows) {
    const psCmd = `$p = Get-Content -Raw "${tmpFile}" -Encoding UTF8; & "${agentBin}" -p $p --dangerously-skip-permissions 2>&1`;
    result = spawnSync('powershell', ['-NonInteractive', '-NoProfile', '-Command', psCmd], {
      cwd: workDir,
      encoding: 'utf8',
      timeout,
      env: { ...process.env, NO_COLOR: '1' },
    });
  } else {
    result = spawnSync(agentBin, ['-p', prompt, '--dangerously-skip-permissions'], {
      cwd: workDir,
      encoding: 'utf8',
      timeout,
      env: { ...process.env, NO_COLOR: '1' },
    });
  }

  // Cleanup temp file
  try { import('fs').then(fs => fs.unlinkSync(tmpFile)); } catch {}

  return {
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    exitCode: result.status ?? -1,
  };
}
