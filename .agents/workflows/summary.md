---
name: summary
description: reduce token usage by summarizing conversation progress into Knowledge Items
---

This workflow helps you save tokens by creating a concise technical summary (KI) of your current session. Use this before starting a new conversation to maintain context without needing to re-read everything.

1. **Synthesize Architecture**: Summarize major technical decisions, patterns, and architectural changes made in this session.
2. **Document Implementation**: List specific files changed, new components, and current state of the implementation.
3. **Draft the Knowledge Item**:
   - Use `write_to_file` to create a `session_summary.md` in the `brain` directory or update a relevant KI in the `knowledge` directory.
   - The summary must include: "Goal", "Accomplishments", "Remaining Tasks", and "Context for Next Session".
4. **Finalize Handover**:
   - Call `task_boundary` to reset active tasks.
   - Advise the user to start a fresh conversation and paste the generated "Context for Next Session" summary to keep the new context window lean and focused.
