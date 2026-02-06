# Enable auto-push after commit (Netlify deploys immediately)

After you **commit**, the repo can **push to `main` automatically** so GitHub Actions runs and Netlify deploys—no need to run `git push` yourself.

## One-time setup

Run this **once** from the **repo root** (e.g. `PFF - Copy`):

```bash
git config core.hooksPath .githooks
```

- **PowerShell / CMD:** You can run that in Git Bash, or in PowerShell:  
  `git config core.hooksPath .githooks`
- **Mac / Linux:** Same command in Terminal.

That tells Git to use the hooks in `.githooks/` instead of `.git/hooks/`.

## What happens after

1. You commit (in Cursor or terminal): `git commit -m "your message"`.
2. The **post-commit** hook runs and runs `git push origin main` (only when you’re on the `main` branch).
3. GitHub receives the push → **Netlify Deploy** workflow runs → Netlify builds and deploys.

You no longer need to run `git push` after commit when you’re on `main`.

## Turn it off

To stop auto-push and use manual push again:

```bash
git config --unset core.hooksPath
```

## Notes

- The hook only pushes when the **current branch is `main`**. On other branches, commit works as usual and nothing is pushed.
- If `git push` fails (e.g. no network, auth, or conflicts), the hook will show the error; fix the issue and run `git push origin main` yourself if needed.
