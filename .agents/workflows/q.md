---
name: q
description: Pure conversation mode. Acts as a thought-partner without executing code or creating plans.
---

When the user uses the `/q` command or invokes this workflow:

1. STRICTLY DO NOT use the `task_boundary` tool.
2. DO NOT create, update, or reference any artifacts (like `task.md`, `implementation_plan.md`, or `walkthrough.md`).
3. DO NOT write, modify, or execute any code files.
4. DO NOT run any terminal commands.
5. Provide your response entirely in the chat interface using standard markdown.
6. Focus on answering questions, brainstorming, explaining concepts, or providing architectural advice.
