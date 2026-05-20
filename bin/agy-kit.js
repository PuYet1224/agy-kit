#!/usr/bin/env node
import { readSkill } from '../lib/skill-reader.js';
import { buildPrompt } from '../lib/prompt-builder.js';
import { runAgent } from '../lib/agent-runner.js';
import { parseAndWriteFiles, hasFileBlocks } from '../lib/output-parser.js';
import { resolve } from 'path';
import { statSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

const args = process.argv.slice(2);
const cmd = args[0];

function parseFlags(args) {
  const flags = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      flags[args[i].slice(2)] = args[i + 1] || true;
      i++;
    }
  }
  return flags;
}

function printHelp() {
  console.log(`
agy-kit — Headless skill executor for agentskills.io

USAGE:
  agy-kit run   --skill <name> --note <requirement> [options]
  agy-kit list  [--dir <path>]
  agy-kit help

OPTIONS:
  --skill   Skill name (matches .agent/skills/<name>/SKILL.md)
  --note    Requirement/task description
  --dir     Working directory (default: current dir)
  --agent   Agent to use: agy | claude | codex (default: agy)
  --timeout Timeout in seconds (default: 600)

EXAMPLES:
  agy-kit run --skill ba-pipeline --note "Create Receipt list screen for SAL module"
  agy-kit run --skill ba-pipeline --note "..." --agent claude --dir ./my-project
  agy-kit list
`);
}

async function cmdRun(flags) {
  const skill = flags.skill;
  const note = flags.note;
  const workDir = resolve(flags.dir || process.cwd());
  const agent = flags.agent || 'agy';
  const timeout = parseInt(flags.timeout || '600') * 1000;

  if (!skill) { console.error('Error: --skill is required'); process.exit(1); }
  if (!note) { console.error('Error: --note is required'); process.exit(1); }

  console.log(`[agy-kit] Skill: ${skill}`);
  console.log(`[agy-kit] Agent: ${agent}`);
  console.log(`[agy-kit] Dir:   ${workDir}`);
  console.log(`[agy-kit] Note:  ${note.slice(0, 80)}${note.length > 80 ? '...' : ''}`);
  console.log('');

  // Read skill
  let skillData;
  try {
    skillData = readSkill(skill, workDir);
    console.log(`[agy-kit] Loaded: ${skillData.path}`);
  } catch (e) {
    console.error(`[agy-kit] ${e.message}`);
    process.exit(1);
  }

  // Build prompt
  const prompt = buildPrompt(skillData.content, note, workDir);
  console.log(`[agy-kit] Prompt size: ${prompt.length} chars`);
  console.log('[agy-kit] Running agent...\n');

  // Run agent
  const startTime = Date.now();
  const result = runAgent(prompt, workDir, agent, timeout);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`[agy-kit] Done in ${elapsed}s (exit: ${result.exitCode})\n`);

  if (result.stdout) {
    // Try to parse file blocks from output
    const written = parseAndWriteFiles(result.stdout, workDir);
    if (written.length > 0) {
      console.log('[agy-kit] Files written:');
      written.forEach(f => console.log(`  + ${f}`));
    } else {
      // Scan for files modified during run
      const modifiedFiles = scanModifiedFiles(workDir, startTime);
      if (modifiedFiles.length > 0) {
        console.log('[agy-kit] Files created/modified:');
        modifiedFiles.forEach(f => console.log(`  + ${f}`));
      } else {
        console.log('[agy-kit] No files detected. Agent output:');
        console.log(result.stdout.slice(0, 1000));
      }
    }
  } else {
    // No stdout — scan for modified files
    const modifiedFiles = scanModifiedFiles(workDir, startTime);
    if (modifiedFiles.length > 0) {
      console.log('[agy-kit] Files created/modified:');
      modifiedFiles.forEach(f => console.log(`  + ${f}`));
    } else {
      console.log('[agy-kit] Warning: No output and no files changed.');
      if (result.stderr) console.log('[agy-kit] Stderr:', result.stderr.slice(0, 500));
    }
  }
}

function scanModifiedFiles(workDir, sinceMs) {
  const result = [];
  const sinceS = sinceMs / 1000;
  function walk(dir, base) {
    try {
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        const rel = join(base, entry);
        try {
          const stat = statSync(full);
          if (stat.isDirectory()) {
            if (!entry.startsWith('.git')) walk(full, rel);
          } else if (stat.mtimeMs / 1000 >= sinceS) {
            result.push(rel);
          }
        } catch {}
      }
    } catch {}
  }
  walk(workDir, '');
  return result;
}

function cmdList(flags) {
  const workDir = resolve(flags.dir || process.cwd());
  const dirs = [
    join(workDir, '.agent', 'skills'),
    join(workDir, '.claude', 'skills'),
    join(workDir, '.agents', 'skills'),
  ];
  const skills = [];
  for (const dir of dirs) {
    if (!existsSync(dir)) continue;
    for (const entry of readdirSync(dir)) {
      if (existsSync(join(dir, entry, 'SKILL.md'))) {
        skills.push({ name: entry, dir });
      }
    }
  }
  if (skills.length === 0) {
    console.log('No skills found in current directory.');
  } else {
    console.log(`Found ${skills.length} skill(s):\n`);
    skills.forEach(s => console.log(`  ${s.name.padEnd(20)} ${s.dir}`));
  }
}

// Main
const flags = parseFlags(args.slice(1));

switch (cmd) {
  case 'run':   cmdRun(flags); break;
  case 'list':  cmdList(flags); break;
  case 'help':
  case '--help':
  case '-h':    printHelp(); break;
  default:      printHelp(); break;
}
