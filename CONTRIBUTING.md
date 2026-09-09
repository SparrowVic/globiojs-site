# Contributing to the GlobioJS website

## Branches and commits

Start from `main` and name each working branch `<prefix>/<short-kebab-case>`:

| Prefix | Purpose |
| --- | --- |
| `feat` | New behavior or UI |
| `fix` | Bug fixes |
| `chore` | Repository maintenance |
| `docs` | Documentation |
| `refactor` | Internal restructuring without behavior changes |
| `test` | Test coverage and test tooling |
| `ci` | Build, validation and deployment workflows |
| `perf` | Performance improvements |

Examples: `fix/studio-project-import` and `docs/react-quickstart`. Choose the prefix by the kind of change and keep the description short and specific.

Commits must identify their human author. Maintainer commits use Wiktor Wróbel's configured Git identity. Keep commits focused on the change, without tool credits or generated co-author trailers.

## Local development

Use Node 24 and pnpm 8.15.0:

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Before opening a PR, run the checks relevant to your change:

```sh
pnpm check:public
pnpm docs:check
pnpm typecheck
pnpm typecheck:e2e
pnpm test
pnpm test:icons
pnpm build
pnpm test:bundle
pnpm exec playwright install chromium
pnpm test:e2e
```

Local development, public pull requests and GitHub Actions use Font Awesome Free icons without a token. Never commit a Font Awesome token or add one to GitHub Actions. Production Pro icons use the protected Netlify production secret; see [Font Awesome setup](docs/FONTAWESOME.md).

## Pull requests and ownership

Open a PR into `main` and describe the resulting behavior and validation. [SparrowVic](https://github.com/SparrowVic) is the sole CODEOWNER and approves and merges changes after required CI succeeds for the current revision. Reviews from other contributors are welcome, but do not replace CODEOWNER approval.

GitHub does not allow authors to approve their own PRs. For SparrowVic's own PRs, the owner reviews the changes and uses the owner-only bypass of the PR approval requirement. Required CI remains mandatory and must not be bypassed.
