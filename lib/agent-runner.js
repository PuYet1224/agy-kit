import { spawnSync } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';

// --- Gemini API (direct, no agy CLI needed) ---
async function runGemini(prompt, timeout) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY environment variable not set');

  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 8192, temperature: 0.2 },
    }),
    signal: controller.signal,
  });

  clearTimeout(timer);

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return { stdout: text, stderr: '', exitCode: 0 };
}

// --- CLI agents (claude, codex) ---
function findBin(name) {
  for (const cmd of [name, `${name}.cmd`, `${name}.exe`]) {
    const result = spawnSync('where', [cmd], { encoding: 'utf8', shell: true });
    if (result.status === 0) return result.stdout.trim().split('\n')[0].trim();
  }
  return name;
}

function runCLI(agentBin, prompt, workDir, timeout) {
  const tmpFile = join(tmpdir(), `agy-kit-${randomBytes(4).toString('hex')}.txt`);
  writeFileSync(tmpFile, prompt, 'utf8');

  const isWindows = process.platform === 'win32';
  let result;

  if (isWindows) {
    const psCmd = `$p = Get-Content -Raw "${tmpFile}" -Encoding UTF8; & "${agentBin}" -p $p --dangerously-skip-permissions 2>&1`;
    result = spawnSync('powershell', ['-NonInteractive', '-NoProfile', '-Command', psCmd], {
      cwd: workDir, encoding: 'utf8', timeout,
      env: { ...process.env, NO_COLOR: '1' },
    });
  } else {
    result = spawnSync(agentBin, ['-p', prompt, '--dangerously-skip-permissions'], {
      cwd: workDir, encoding: 'utf8', timeout,
      env: { ...process.env, NO_COLOR: '1' },
    });
  }

  try { unlinkSync(tmpFile); } catch {}

  return {
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    exitCode: result.status ?? -1,
  };
}

// --- Main export ---
export async function runAgent(prompt, workDir, agentName = 'gemini', timeout = 600000) {
  if (agentName === 'gemini') {
    return runGemini(prompt, timeout);
  }

  const binMap = { claude: 'claude', codex: 'codex', agy: 'agy' };
  const bin = findBin(binMap[agentName] || agentName);
  return runCLI(bin, prompt, workDir, timeout);
}
