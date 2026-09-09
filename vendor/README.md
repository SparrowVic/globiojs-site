# Bootstrap package artifacts

Package source: [SparrowVic/globiojs@0d11f79](https://github.com/SparrowVic/globiojs/tree/0d11f79).

Version 0.1.0. These are real publishable package archives pending the first npm publication. Core, React, Vue and the Vanilla alias were packed with pnpm; Angular was packed from its APF dist directory with npm.

The packed-consumer checks passed: ESM and CommonJS imports, TypeScript declarations and Angular production AOT.

SHA-256 checksums:

```text
1b2543f91d05301e57cef37abfe5a9b219bf63f0d60822bfb8bcc9743c970447  globiojs-0.1.0.tgz
709c52a7f26aeb623569808b71ad0ffa989ad1a24cf1d875b08028a82511befd  globiojs-angular-0.1.0.tgz
4143de6654db41dde1cdd23baeae44f3a05ad15869a5bda1eb1e87e836739696  globiojs-core-0.1.0.tgz
60b89edadfbd75a18be2bdff88e9a7d710f544e8435fa12280392116bedf8597  globiojs-react-0.1.0.tgz
d1aa61926516cb02198a5546e0ba1f6250274efe74a53dc9f077ddf692b3f2ef  globiojs-vue-0.1.0.tgz
```

After the npm release, replace file dependencies with the corresponding published versions and remove these bootstrap archives.
