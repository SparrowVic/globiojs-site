# Bootstrap package artifacts

Built from [SparrowVic/globiojs@ee7801b9318829fe775a7935017055b9051c8cd5](https://github.com/SparrowVic/globiojs/tree/ee7801b9318829fe775a7935017055b9051c8cd5).

Version 0.1.0. These are real publishable package archives, pending the first npm publication. Core, React, Vue and the Vanilla alias were packed with pnpm; Angular was packed from its APF dist directory with npm.

The full packed-consumer checks passed: ESM and CommonJS runtime imports, TypeScript declarations and Angular production AOT.

SHA-256 checksums:

```text
40fb8fb8584a84205799e971f8b0cbc55e690a2202b942476c0895015e83e9aa  globiojs-0.1.0.tgz
49b3010c758ef19ad7a4fc90f06dd9cbaad4d049cdbc019307d812871bac1b56  globiojs-angular-0.1.0.tgz
8c6fbe86efaac82ae766f1d52d9bfce0fe078035df52ad8c43045a0e94b42d31  globiojs-core-0.1.0.tgz
e44ef257ebce7c23fb5e1a1a8e577360a607d7e4a4f4e9eabb31e08c94952a3a  globiojs-react-0.1.0.tgz
ab2698843967c3bd0b37b71847498b1d8157e46ed9df765cb199e365c0ab37c1  globiojs-vue-0.1.0.tgz
```

After the npm release, replace file dependencies with the same published versions and remove these bootstrap archives.
