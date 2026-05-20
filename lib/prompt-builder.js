export function buildPrompt(skillContent, note, workDir) {
  return `${skillContent}

---

EXECUTION CONTEXT:
- Target project directory: ${workDir}
- Do NOT create workspaces, scratch folders, or brain sessions.

CRITICAL RULES FOR HEADLESS EXECUTION (MUST FOLLOW — NO EXCEPTIONS):
1. Do NOT ask questions. Do NOT wait for user input. Do NOT request clarification.
2. Do NOT write files to disk directly. You CANNOT write files — the filesystem is read-only.
3. OUTPUT all file content in the STDOUT FORMAT below. This is the ONLY way files will be saved.
4. If the workflow asks to "find" a file, use the REQUIREMENT text as the raw input content.
5. If the workflow asks for a feature name, derive it from the REQUIREMENT text.
6. Execute ALL steps to completion in one single pass. Never stop mid-way.
7. Make reasonable assumptions and proceed immediately.

REQUIREMENT (use this as the raw input / meeting notes for the workflow):
${note}

MANDATORY OUTPUT FORMAT — use this for EVERY file you produce:
=== FILE: requirements/MEETING_phieu-thu.md ===
[full file content here]
=== END FILE ===

Replace the path above with the correct relative path for each file.
Output ALL files using this format before finishing. Do not skip any file.

Start execution now.`;
}
