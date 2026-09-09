# Font Awesome in the public website repository

Anyone can install, run and test this website without a Font Awesome account.
Local builds, GitHub Actions and Netlify previews use Font Awesome Free. The
Netlify production build uses the existing Sharp Solid and Sharp Duotone Solid
icons after downloading the two licensed packages during the build.

The token grants package-registry access. It is never part of application source
or browser assets. The rendered icons are, naturally, visible on the website.

## Add the production token in Netlify

1. Open the **GlobioJS site** in Netlify.
2. Open **Project configuration → Environment variables → Add a variable**.
3. Name it **`FONTAWESOME_PACKAGE_TOKEN`**.
4. Paste the **Package Token** from your Font Awesome account. This is not a Kit
   ID, Kit URL or Font Awesome API token.
5. Mark the value as secret/sensitive, give it only the **Builds** scope, and set
   its value only for the **Production** deploy context. Leave Deploy Previews,
   branch deploys and Preview Servers without a value.
6. For untrusted deploys, select **Deploy without sensitive variables** in the
   site's sensitive-variable policy.
7. Run a production deploy after saving the variable.

Do not add this token to GitHub Actions secrets: CI does not need it. Do not put
it in `netlify.toml`, a committed `.npmrc`, a `VITE_*` variable or an issue.

The configured Netlify build command is `pnpm build:netlify`. A production deploy
fails clearly if the token is missing or invalid. Preview builds do not require
the token, even when the production site has one configured.

## How the build works

- The public `package.json` and `pnpm-lock.yaml` contain only Free icon packages.
- `scripts/fontawesome-pro/package.json` pins the two Pro families to **7.2.0**.
  Its npm lockfile also pins the common types dependency and integrity hashes.
  Registry URLs are omitted so the isolated npm registry configuration is used.
- `scripts/fontawesome-install.mjs` copies that manifest into the ignored
  `.fontawesome-pro/` directory and runs `npm ci --ignore-scripts`.
- npm receives the token through its environment and a temporary `.npmrc` that
  contains a variable reference. npm output is not forwarded. Its temporary
  configuration, download cache and debug logs are removed afterwards.
- The build removes Font Awesome credential variables before launching Vite.
  Vite resolves the two original family imports to their local ESM entry points.
  Named imports remain tree-shakeable; the full icon catalog is not bundled.
- After a successful production build, every file in `dist/` is scanned for the
  literal package token. A match fails the build with the affected filename;
  the credential value is never logged.
- After the production build, the isolated Pro installation is removed so it
  cannot become part of a later deployment's dependency cache.
- GitHub Actions and non-production Netlify builds always use the Free mapping,
  even if a previous build left licensed packages in a local cache.

No Pro packages, private registry credentials or private package caches are
uploaded as GitHub Actions artifacts. Do not add `.fontawesome-pro/`, `.npmrc` or
a Pro npm cache to a shared Actions cache: pull requests can read base-branch
caches in a public repository.

## Local development

`pnpm dev`, `pnpm build`, `pnpm typecheck` and `pnpm test` use Free icons without
any credentials. The Free build uses close equivalents for twelve Pro-only
names, so every control still has an icon. Sharp edges and duotone details are
preserved in the production Pro build.

If you own a Pro license and need to inspect the exact production appearance,
place `FONTAWESOME_PACKAGE_TOKEN=your-package-token` in an ignored `.env.local`
file, then use Node 24:

```sh
node --env-file=.env.local scripts/fontawesome-install.mjs
GLOBIOJS_ICON_MODE=pro pnpm dev
```

The token is read only by the installer. The second command needs no token.
Never commit `.env.local` or share it in a bug report.

## Updating icons

Keep the three public Font Awesome packages and the two Pro families on the same
version. Regenerate the isolated npm lockfile when changing the Pro version;
do not weaken the `npm ci` integrity check. Add a Free fallback export to
`src/lib/icons-free.ts` for a newly introduced Pro-only icon. Typechecking the
application validates every imported name without downloading Pro assets.

References: [Font Awesome package setup](https://docs.fontawesome.com/web/setup/packages),
[Netlify environment variables](https://docs.netlify.com/build/environment-variables/get-started/),
[GitHub Actions cache access](https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching).
