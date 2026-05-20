export function buildPrompt(skillContent, note, workDir) {
  return `${skillContent}

---

EXECUTION CONTEXT:
- Working directory: ${workDir}
- Write ALL output files to the working directory above using relative paths
- Do NOT create workspaces or scratch folders

CRITICAL RULES FOR HEADLESS EXECUTION (MUST FOLLOW):
- Do NOT ask questions. Do NOT wait for user input. Do NOT request clarification.
- If the workflow asks to "find" a file and it is not found, use the REQUIREMENT text below as the raw input content.
- If the workflow asks for a feature name, derive it from the REQUIREMENT text.
- Execute ALL steps to completion in one single pass.
- Make reasonable assumptions and proceed. Never stop mid-way.

REQUIREMENT (treat this as the raw input / meeting notes for the workflow):
${note}

OUTPUT FORMAT FOR FILES:
When creating or updating files, use this exact format:
=== FILE: relative/path/to/file.md ===
[file content here]
=== END FILE ===

Start execution now. Complete all steps without stopping.`;
}
