# GitHub Actions workflows

These workflows are kept here rather than in `.github/workflows/` because the
bot account that opened this branch does not hold the `workflows` permission on
the repository, so it cannot push files into `.github/workflows/`.

To enable them, copy them into place and commit from your own account:

```bash
mkdir -p .github/workflows
cp docs/github-workflows/*.yml .github/workflows/
git add .github/workflows && git commit -m "Add CI workflows" && git push
```

For `deploy-pages.yml`, also set **Settings → Pages → Source** to **GitHub Actions**.
Without it Pages serves the repository source, whose `index.html` points at the
dev-only `/src/main.tsx` entry, so the site renders a blank page.

| Workflow | What it does |
| --- | --- |
| `ci.yml` | On every push/PR: typecheck, perft (move generator correctness), engine tactical suite, multiplayer rule tests, production build |
| `deploy-pages.yml` | On pushes to `main`: builds the app with `PUBLIC_BASE_PATH=/<repo>/` and publishes `dist/` to GitHub Pages |
| `deploy-rules.yml` | On pushes to `main` that touch `firestore.rules`: publishes the rules. Skips itself unless the `FIREBASE_SERVICE_ACCOUNT` repository secret exists, so it never fails the branch |
