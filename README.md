# GlobioJS website

The public website, interactive Studio and documentation for [GlobioJS](https://github.com/SparrowVic/globiojs).

## Local development

Use Node 24 and pnpm 8.15.0:

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

No Font Awesome token is required. Local builds and public pull requests use Font Awesome Free equivalents. Production on Netlify uses the original Pro icons with a secret available only to the production build. See [Font Awesome setup](docs/FONTAWESOME.md).

## Validation

```sh
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

GitHub Actions runs these checks with public dependencies and without Font Awesome secrets.

## Library versions

Until the first npm publication, `vendor/` contains actual package tarballs built from the GlobioJS library repository, with provenance in `vendor/README.md`. They contain the same public code and declarations that are prepared for npm; the website never imports library source files from another checkout.

After publication, replace the four `file:vendor/...` dependencies with the released versions, update the lockfile and run `pnpm docs:extract`. Wrapper packages are development dependencies used to typecheck documented examples. The runtime only needs `@globiojs/core` and Three.js.

To test an upcoming release locally, replace the tarballs with `pnpm pack` output from the library repository, reinstall and run `pnpm docs:extract`. Keep the tarball versions consistent across core and wrappers.

## Deployment

Netlify builds the `main` branch with `pnpm build:netlify` and publishes `dist`. Pull-request previews use free icons. Production requires `FONTAWESOME_PACKAGE_TOKEN` (Builds scope, Production context only, marked as a secret). Never add it to GitHub Actions, `.env` files in Git, `netlify.toml` or a `VITE_` variable.

The site is prepared for `globiojs.dev`; attach the domain in Netlify after purchasing it and configuring DNS.

## License

Application source: MIT © Wiktor Wróbel. Font Awesome Pro is a separate licensed dependency and is not included in this repository. Third-party fonts, icons and Earth assets retain their respective licenses; see the notices shipped with the assets.
