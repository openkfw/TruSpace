---
title: Contributing
description: How to contribute to TruSpace — git workflow, code style, and PR guidelines
icon: material/source-pull
tags:
  - contributing
  - developer
  - community
---

# Contributing

We welcome contributions of all kinds — bug fixes, features, documentation, and discussions. This page covers everything you need to know to contribute effectively.

!!! note "Code of Conduct"
    All contributors are expected to follow our [Code of Conduct](code-of-conduct.md). Please read it before participating.

---

## Ways to Contribute

### Reporting Issues

Use [GitHub Issues](https://github.com/openkfw/TruSpace/issues) to report problems or request features. We provide templates for:

- **Bug Report** — something isn't working as expected
- **Feature Request** — an idea for a new capability
- **Documentation Improvement** — missing, unclear, or outdated docs

Choose the appropriate template, or open a blank issue if none fit.

### Discussions

For questions, ideas, or broader topics, use [GitHub Discussions](https://github.com/openkfw/TruSpace/discussions). Add tags to help categorize your post and make it easier for others to find.

### Pull Requests

Code, documentation, and test contributions are made via pull requests. Follow the workflow below to ensure a smooth review.

---

## Git Workflow

### 1. Set up your fork

```bash
# Fork the repo on GitHub, then clone your fork
git clone https://github.com/<your-username>/TruSpace.git
cd TruSpace

# Add the upstream remote
git remote add upstream https://github.com/openkfw/TruSpace.git
```

### 2. Create a branch

Always branch off the latest `main`:

```bash
git checkout main
git pull upstream main
git checkout -b <issue-number>-short-description
```

**Branch naming rules:**

- Lead with the issue number: `292-private-workspace-permissions`
- Use hyphens as separators, not underscores or spaces
- Keep it short but descriptive

### 3. Make your changes

- Keep commits focused — one logical change per commit
- Do not squash everything into a single commit, especially for large changes
- Write tests for new behaviour

### 4. Write good commit messages

Follow the [standard commit guidelines](https://cbea.ms/git-commit/):

```
Add workspace permission sync across IPFS nodes

Implements event-based permission propagation using IPFS as the
event bus. Each node writes a permission event file, and peers
detect and process it asynchronously.

Closes #292
```

Rules at a glance:

| Rule | Detail |
|---|---|
| Imperative subject line | "Add feature" not "Added feature" |
| 50-character subject limit | Keeps `git log` readable |
| 72-character body wrap | Standard terminal width |
| Reference issues | `Closes #123` or `Refs #123` |

### 5. Keep your branch up to date

Before opening a PR and before merging, rebase onto the latest `main`:

```bash
git pull --rebase upstream main
git push --force-with-lease origin <your-branch>
```

### 6. Open a Pull Request

Push your branch and open a PR on GitHub. Fill out the PR template fully:

- Describe **what** changed and **why**
- Reference the issue it closes: `Closes #<issue-number>`
- List any manual testing steps
- Request a review from a specific team member if needed

### 7. Respond to review and merge

- Address all review comments
- Re-request review once resolved
- The reviewer or maintainer merges once approved and pipelines are green

---

## Code Style

| Area | Standard |
|---|---|
| Language | TypeScript throughout (backend + frontend) |
| Linting | ESLint — run `npm run lint` |
| Formatting | Prettier — run `npm run lint:fix` |
| Type checking | `npm run typecheck` |

Run all checks before pushing:

```bash
npm run lint
npm run typecheck
npm run build
```

---

## Pull Request Checklist

Before marking your PR ready for review:

- [ ] Tests written or updated for the changed behaviour
- [ ] `npm run lint` passes with no errors
- [ ] `npm run typecheck` passes
- [ ] Documentation updated if behaviour changes
- [ ] PR description references the relevant issue
- [ ] No unrelated changes included

---

## Security Fixes & Dependency Updates

To keep dependencies secure:

```bash
# Check for vulnerabilities
npm audit

# Auto-fix non-breaking updates
npm audit fix

# Force-fix (may introduce breaking changes — test thoroughly)
npm audit fix --force

# Update a specific package
npm update <package-name>
```

After updating packages:

1. Delete cached modules to ensure a clean install:
   ```bash
   rm -rf node_modules/ .next/
   npm install
   ```
2. Run the full test suite and start the app to verify nothing broke
3. Run `npm run build` to catch type errors
4. Open a dedicated PR for the dependency update

!!! tip "npm-check-updates"
    For a broader view of available updates:
    ```bash
    npm install -g npm-check-updates
    ncu   # shows what can be updated
    ncu -u # writes updates to package.json
    npm install
    ```

---

## Writing Documentation

All TruSpace documentation lives in [`doc/mkdocs/docs/`](https://github.com/openkfw/TruSpace/tree/main/doc/mkdocs/docs) and is built with [MkDocs](https://www.mkdocs.org/) using the [Material theme](https://squidfunk.github.io/mkdocs-material/). Centralizing documentation this way keeps information accessible for developers, contributors, admins, and users alike.

It's important that documentation stays up to date and accurately reflects the current state of the project. If you spot discrepancies or outdated information, please update it directly or open an issue to discuss the change.

**Guidelines when writing documentation:**

1. Use Markdown syntax for formatting, and take advantage of Material for MkDocs features (admonitions, tabs, cards) where they improve clarity.
2. Keep language clear and concise.
3. Use code blocks for any code snippets or commands.
4. Include examples where applicable.
5. Add front matter (`title`, `description`, `icon`, `tags`) consistent with existing pages.
6. Update `mkdocs.yml` navigation when adding new pages.

To preview your changes locally before opening a PR:

```bash
cd doc/mkdocs
pip install mkdocs-material
mkdocs serve
```

Then open [http://localhost:8000](http://localhost:8000) to view the rendered site with live reload.

---

## Getting Help

- [:fontawesome-brands-github: GitHub Discussions](https://github.com/openkfw/TruSpace/discussions) — questions and ideas
- [:material-bug: GitHub Issues](https://github.com/openkfw/TruSpace/issues) — bugs and feature requests
- [:material-file-document: Code of Conduct](code-of-conduct.md) — community standards
