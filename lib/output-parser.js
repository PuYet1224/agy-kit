import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

const FILE_BLOCK = /=== FILE: (.+?) ===\n([\s\S]*?)\n=== END FILE ===/g;

export function parseAndWriteFiles(output, workDir) {
  const written = [];
  let match;

  FILE_BLOCK.lastIndex = 0;
  while ((match = FILE_BLOCK.exec(output)) !== null) {
    const relPath = match[1].trim();
    const content = match[2];
    const absPath = join(workDir, relPath);

    mkdirSync(dirname(absPath), { recursive: true });
    writeFileSync(absPath, content, 'utf8');
    written.push(relPath);
  }

  return written;
}

export function hasFileBlocks(output) {
  FILE_BLOCK.lastIndex = 0;
  return FILE_BLOCK.test(output);
}
