# Install script for `@rxdi` Inter planetary decentralized node modules

> This repository is created to help rxdi ipfs packages to be installed easy

#### Install globally
```bash
npm i @rxdi/install -g
```

#### Install dependencies
Execute inside root folder of rxdi project
```bash
rxdi-install
```

Will read `package.json` in particular `ipfs` object with properties:
```json
  "ipfs": [{
    "provider": "https://ipfs.io/ipfs/",
    "dependencies": [
      "QmWtJLqyokMZE37DgncpY5HhFvtFQieBzMPDQ318aJeTw6"
    ]
  }],
```

#### Install single dependency:

Short version defaults to `https://ipfs.io/ipfs/`
```bash
rxdi-install QmWtJLqyokMZE37DgncpY5HhFvtFQieBzMPDQ318aJeTw6
```

Long version
```bash
rxdi-install --hash=QmWtJLqyokMZE37DgncpY5HhFvtFQieBzMPDQ318aJeTw6 --provider=https://ipfs.io/ipfs/
```

#### Same command is exposed when you install `@rxdi/core` global syntax is different
```bash
npm i -g @rxdi/core
```

```bash
rxdi install QmWtJLqyokMZE37DgncpY5HhFvtFQieBzMPDQ318aJeTw6
```

Even shorter
```bash
rxdi i QmWtJLqyokMZE37DgncpY5HhFvtFQieBzMPDQ318aJeTw6
```