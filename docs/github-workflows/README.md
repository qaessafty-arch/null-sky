# GitHub Actions workflows

These two workflows are kept here rather than in `.github/workflows/` because the
bot account that opened this branch does not hold the `workflows` permission on
the repository, so it cannot push files into `.github/workflows/`.

To enable them, copy them into place and commit from your own account:

```bash
mkdir -p .github/workflows
cp docs/github-workflows/ci.yml docs/github-workflows/deploy-rules.yml .github/workflows/
git add .github/workflows && git commit -m "Add CI workflows" && git push
```

| Workflow | What it does |
| --- | --- |
| `ci.yml` | On every push/PR: typecheck, perft (move generator correctness), engine tactical suite, multiplayer rule tests, production build |
| `deploy-rules.yml` | On pushes to `main` that touch `firestore.rules`: publishes the rules. Skips itself unless the `FIREBASE_SERVICE_ACCOUNT` repository secret exists, so it never fails the branch |
