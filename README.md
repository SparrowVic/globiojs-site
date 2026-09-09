# GlobioJS website

The public website, interactive Studio and documentation for [GlobioJS](https://github.com/SparrowVic/globiojs).

## Local development

Use Node 24 and pnpm 8.15.0:

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

No Font Awesome token is required. Local builds and public pull requests use Font Awesome Free equivalents. Production on Netlify uses the original Pro icons with a secret available only in the Production context. See [Font Awesome setup](docs/FONTAWESOME.md).

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

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for branch names, commit authorship, local checks and owner approval requirements.

## Library versions

The site installs the published `@globiojs/core`, `@globiojs/react`, `@globiojs/vue` and `@globiojs/angular` packages from npm, pinned to version `0.1.0`. The lockfile records their registry integrity hashes. Package source and release history live in [SparrowVic/globiojs](https://github.com/SparrowVic/globiojs); local bootstrap archives are no longer needed.

Wrapper packages are development dependencies used to typecheck documented examples. The runtime only needs `@globiojs/core` and Three.js. The website never imports library source files from another checkout.

When upgrading GlobioJS, update all four exact versions together, refresh the lockfile and run `pnpm docs:extract` to synchronize API metadata from the installed core package. Then run the validation commands above before deploying.

## Deployment

Netlify builds the `main` branch with `pnpm build:netlify` and publishes `dist`. Pull-request previews use free icons. Production requires `FONTAWESOME_PACKAGE_TOKEN` (Production context only, marked as a secret). Select only the Builds scope when the Netlify plan supports custom scopes; the current Free plan keeps all scopes enabled. This site is static and has no Functions or runtime code that needs the token. Never add it to GitHub Actions, `.env` files in Git, `netlify.toml` or a `VITE_` variable.

The site is prepared for `globiojs.dev`; attach the domain in Netlify after purchasing it and configuring DNS.

## License

Application source: MIT © Wiktor Wróbel. Font Awesome Pro is a separate licensed dependency and is not included in this repository. Third-party fonts, icons and Earth assets retain their respective licenses; see the notices shipped with the assets.
