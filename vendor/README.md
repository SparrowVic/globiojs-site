# Bootstrap package artifacts

Package source: [SparrowVic/globiojs@c8f6f8a](https://github.com/SparrowVic/globiojs/tree/c8f6f8a).

Version 0.1.0. These are real publishable package archives pending the first npm publication. Core, React, Vue and the Vanilla alias were packed with pnpm; Angular was packed from its APF dist directory with npm.

The packed-consumer checks passed: ESM and CommonJS imports, TypeScript declarations and Angular production AOT.

SHA-256 checksums:

```text
40fb8fb8584a84205799e971f8b0cbc55e690a2202b942476c0895015e83e9aa  globiojs-0.1.0.tgz
66928e4c5bb9d93e2254fc2e80da9b9ed175d4f468eb42967e2f05c794cee1ac  globiojs-angular-0.1.0.tgz
8c6fbe86efaac82ae766f1d52d9bfce0fe078035df52ad8c43045a0e94b42d31  globiojs-core-0.1.0.tgz
e44ef257ebce7c23fb5e1a1a8e577360a607d7e4a4f4e9eabb31e08c94952a3a  globiojs-react-0.1.0.tgz
ab2698843967c3bd0b37b71847498b1d8157e46ed9df765cb199e365c0ab37c1  globiojs-vue-0.1.0.tgz
```

After the npm release, replace file dependencies with the corresponding published versions and remove these bootstrap archives.
