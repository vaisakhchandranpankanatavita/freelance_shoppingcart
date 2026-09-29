# Project instructions

## Git workflow

- Never create git worktrees or worktree branches automatically (no `EnterWorktree`, no `isolation: "worktree"` on agents, no `git worktree add`). Only do it if the user explicitly asks for a worktree in that message.
- Work directly on the current branch (`main`) in the project folder. Do not create side branches unless asked.
