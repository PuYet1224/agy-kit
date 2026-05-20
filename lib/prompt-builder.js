export function buildPrompt(skillContent, note, workDir) {
  return `${skillContent}

---

EXECUTION CONTEXT:
- Working directory: ${workDir}
- Write ALL output files to the working directory above using relative paths
- Do NOT create workspaces or scratch folders
- Do NOT ask questions or wait for confirmation
- Execute immediately and completely in one shot

REQUIREMENT:
${note}

OUTPUT FORMAT FOR FILES:
When creating files, use this exact format so they can be captured:
=== FILE: relative/path/to/file.md ===
[file content here]
=== END FILE ===

Start execution now.`;
}
