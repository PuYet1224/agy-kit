import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

export function readSkill(skillName, workDir) {
  const candidates = [
    // Skills
    { path: join(workDir, '.agent', 'skills', skillName, 'SKILL.md'), type: 'skill' },
    { path: join(workDir, '.claude', 'skills', skillName, 'SKILL.md'), type: 'skill' },
    { path: join(workDir, '.agents', 'skills', skillName, 'SKILL.md'), type: 'skill' },
    // Workflows
    { path: join(workDir, '.agent', 'workflows', `${skillName}.md`), type: 'workflow' },
    { path: join(workDir, '.claude', 'workflows', `${skillName}.md`), type: 'workflow' },
    { path: join(workDir, '.agents', 'workflows', `${skillName}.md`), type: 'workflow' },
  ];

  for (const c of candidates) {
    if (existsSync(c.path)) {
      return { path: c.path, content: readFileSync(c.path, 'utf8'), type: c.type };
    }
  }

  throw new Error(
    `Skill/workflow "${skillName}" not found. Looked in:\n${candidates.map(c => '  ' + c.path).join('\n')}`
  );
}

export function listSkills(workDir) {
  const results = [];

  const skillDirs = [
    join(workDir, '.agent', 'skills'),
    join(workDir, '.claude', 'skills'),
    join(workDir, '.agents', 'skills'),
  ];
  for (const dir of skillDirs) {
    if (!existsSync(dir)) continue;
    for (const entry of readdirSync(dir)) {
      const p = join(dir, entry, 'SKILL.md');
      if (existsSync(p)) results.push({ name: entry, type: 'skill', dir });
    }
  }

  const workflowDirs = [
    join(workDir, '.agent', 'workflows'),
    join(workDir, '.claude', 'workflows'),
    join(workDir, '.agents', 'workflows'),
  ];
  for (const dir of workflowDirs) {
    if (!existsSync(dir)) continue;
    for (const entry of readdirSync(dir)) {
      if (!entry.endsWith('.md')) continue;
      const name = entry.replace(/\.md$/, '');
      results.push({ name, type: 'workflow', dir });
    }
  }

  // Deduplicate by name
  const seen = new Set();
  return results.filter(r => {
    if (seen.has(r.name)) return false;
    seen.add(r.name);
    return true;
  });
}
