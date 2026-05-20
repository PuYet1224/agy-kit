import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

export function readSkill(skillName, workDir) {
  const candidates = [
    join(workDir, '.agent', 'skills', skillName, 'SKILL.md'),
    join(workDir, '.claude', 'skills', skillName, 'SKILL.md'),
    join(workDir, '.agents', 'skills', skillName, 'SKILL.md'),
  ];

  for (const p of candidates) {
    if (existsSync(p)) {
      return { path: p, content: readFileSync(p, 'utf8') };
    }
  }

  throw new Error(`Skill "${skillName}" not found. Looked in:\n${candidates.map(p => '  ' + p).join('\n')}`);
}

export function listSkills(workDir) {
  const dirs = [
    join(workDir, '.agent', 'skills'),
    join(workDir, '.claude', 'skills'),
    join(workDir, '.agents', 'skills'),
  ];

  const skills = [];
  for (const dir of dirs) {
    if (!existsSync(dir)) continue;
    for (const entry of readdirSync(dir)) {
      const skillMd = join(dir, entry, 'SKILL.md');
      if (existsSync(skillMd)) skills.push(entry);
    }
  }
  return [...new Set(skills)];
}
